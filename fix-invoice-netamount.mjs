import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://kscabcs3d:cs123@cell0.ybqjbbx.mongodb.net/fortunemix?retryWrites=true&w=majority";

await mongoose.connect(MONGODB_URI);
console.log("Connected to MongoDB");

const InvoiceSchema = new mongoose.Schema({}, { strict: false });
const Invoice =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema, "invoices");

const invoices = await Invoice.find({}).lean();
console.log(`Total invoices found: ${invoices.length}`);

let fixedCount = 0;
let skippedCount = 0;

for (const inv of invoices) {
  const totalAmount = Number(inv.totalAmount || 0);
  const currentNetAmount = Number(inv.netAmount || 0);
  const cgst = Number(inv.cgstRate ?? 9);
  const sgst = Number(inv.sgstRate ?? 9);
  const taxRate = (cgst + sgst) / 100;

  if (totalAmount <= 0) { skippedCount++; continue; }

  const expectedGross = totalAmount / (1 + taxRate);
  const ratio = expectedGross > 0 ? Math.abs(currentNetAmount - expectedGross) / expectedGross : 1;

  if (ratio < 0.01) { skippedCount++; continue; }

  const correctedNetAmount = Math.round(expectedGross * 100) / 100;
  await Invoice.updateOne({ _id: inv._id }, { $set: { netAmount: correctedNetAmount } });
  console.log(`Fixed [${inv.invoiceNumber}]: netAmount ${currentNetAmount} -> ${correctedNetAmount} (total: ${totalAmount})`);
  fixedCount++;
}

console.log(`Done! Fixed: ${fixedCount} | Skipped: ${skippedCount}`);
await mongoose.disconnect();
