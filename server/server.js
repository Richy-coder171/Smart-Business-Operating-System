import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";

await connectDB();

const server = app.listen(env.port, () => {
  console.log(`SMEOS backend listening on port ${env.port}.`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${env.port} is already in use. Stop the existing SMEOS backend before starting another instance.`
    );
    process.exit(1);
  }

  console.error(`Server failed to start: ${error.message}`);
  process.exit(1);
});

async function shutdown() {
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
