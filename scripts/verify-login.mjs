import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const edgePath =
  process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = Number(process.env.EDGE_DEBUG_PORT || 9333);
const targetUrl = process.env.VERIFY_URL || "http://localhost:5173/login";
const profileDir = path.join(root, ".edge-verification-profile");
const screenshotPath = path.join(root, ".verification-login.png");

class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.handleMessage(event));
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }

    const handlers = this.listeners.get(message.method) || [];
    for (const handler of handlers) handler(message.params || {});
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 12000);
    });
  }

  once(method, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${method} timed out`)), timeoutMs);
      const handler = (params) => {
        clearTimeout(timer);
        this.off(method, handler);
        resolve(params);
      };
      this.on(method, handler);
    });
  }

  on(method, handler) {
    this.listeners.set(method, [...(this.listeners.get(method) || []), handler]);
  }

  off(method, handler) {
    this.listeners.set(
      method,
      (this.listeners.get(method) || []).filter((item) => item !== handler)
    );
  }

  close() {
    this.ws.close();
  }
}

async function waitForJson(url, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

await rm(profileDir, { recursive: true, force: true });
await mkdir(profileDir, { recursive: true });

const edge = spawn(
  edgePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "about:blank"
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);

let stderr = "";
edge.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const newTarget = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(targetUrl)}`,
    { method: "PUT" }
  ).then((response) => response.json());

  const cdp = new CDP(newTarget.webSocketDebuggerUrl);
  await cdp.open();

  const consoleErrors = [];
  const runtimeExceptions = [];

  cdp.on("Runtime.consoleAPICalled", (params) => {
    if (["error", "assert"].includes(params.type)) {
      consoleErrors.push(params.args?.map((arg) => arg.value || arg.description).join(" "));
    }
  });
  cdp.on("Runtime.exceptionThrown", (params) => {
    runtimeExceptions.push(params.exceptionDetails?.text || "Runtime exception");
  });
  cdp.on("Log.entryAdded", (params) => {
    if (params.entry?.level === "error") {
      consoleErrors.push(params.entry.text);
    }
  });

  await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Log.enable")]);
  const load = cdp.once("Page.loadEventFired", 15000).catch(() => null);
  await cdp.send("Page.navigate", { url: targetUrl });
  await load;
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const text = await cdp.send("Runtime.evaluate", {
    expression: "document.body.innerText",
    returnByValue: true
  });
  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
  cdp.close();

  const bodyText = text.result?.value || "";
  console.log(
    JSON.stringify(
      {
        url: targetUrl,
        screenshotPath,
        visibleLogin: bodyText.includes("Login") && bodyText.includes("SMEOS"),
        bodyText,
        fatalConsoleErrors: runtimeExceptions.length,
        consoleErrors,
        runtimeExceptions
      },
      null,
      2
    )
  );
} finally {
  edge.kill();
  if (stderr && process.env.VERIFY_VERBOSE === "true") {
    console.error(stderr);
  }
}
