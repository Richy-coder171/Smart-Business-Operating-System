function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function dateOnly(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function slug(value) {
  return String(value || "customer")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function exportLedgerCsv(customer, transactions) {
  const rows = [
    ["Date", "Type", "Amount", "Description", "Payment Method", "Running Balance"],
    ...transactions.map((transaction) => [
      dateOnly(transaction.date),
      transaction.type,
      transaction.amount,
      transaction.description || "",
      transaction.paymentMethod || "",
      transaction.runningBalance
    ])
  ];

  const csv = buildLedgerCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug(customer?.name)}-ledger.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildLedgerCsv(rows) {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}
