import fs from 'fs';
import path from 'path';

const sql = fs.readFileSync('dump.sql', 'utf8');

function extractData(tableName) {
  const startRegex = new RegExp(`COPY public\\.${tableName} .* FROM stdin;`, 'g');
  const match = startRegex.exec(sql);
  if (!match) return [];

  const startIdx = match.index + match[0].length + 1;
  const endIdx = sql.indexOf('\\.', startIdx);
  const dataBlock = sql.substring(startIdx, endIdx).trim();
  
  if (!dataBlock) return [];
  return dataBlock.split('\n').map(line => line.split('\t'));
}

const customersRaw = extractData('customers');
const invoicesRaw = extractData('invoices');
const productsRaw = extractData('products');
const employeesRaw = extractData('employees');
const purchaseOrdersRaw = extractData('purchase_orders');
const deliveryChallansRaw = extractData('delivery_challans');

const mockCustomers = customersRaw.map(c => ({
  id: parseInt(c[0]),
  name: c[1],
  address: c[2],
  contact: c[3],
  email: c[4],
  gstNumber: c[5],
  creditTerms: c[6],
  createdAt: c[7],
  updatedAt: c[8]
}));

const mockInvoices = invoicesRaw.map(inv => ({
  id: parseInt(inv[0]),
  invoiceNumber: inv[1],
  invoiceDate: inv[2],
  customerId: parseInt(inv[3]),
  customerName: mockCustomers.find(c => c.id === parseInt(inv[3]))?.name || 'Unknown',
  totalAmount: parseFloat(inv[4] || 0),
  status: inv[5],
  dueDate: inv[6],
  createdAt: inv[7],
  updatedAt: inv[8]
}));

const mockPurchaseOrders = purchaseOrdersRaw.map(po => ({
  id: parseInt(po[0]),
  poNumber: po[1],
  orderDate: po[2],
  customerId: parseInt(po[3]),
  customerName: mockCustomers.find(c => c.id === parseInt(po[3]))?.name || 'Unknown',
  totalAmount: parseFloat(po[4] || 0),
  status: po[5],
  createdAt: po[6],
  updatedAt: po[7]
}));

const mockDeliveryChallans = deliveryChallansRaw.map(dc => ({
  id: parseInt(dc[0]),
  dcNumber: dc[1],
  dcDate: dc[2],
  invoiceId: parseInt(dc[3]),
  vehicleId: parseInt(dc[4]),
  status: dc[5],
  destination: dc[6],
  createdAt: dc[7],
  updatedAt: dc[8]
}));

// Summary
const totalCustomers = mockCustomers.length;
const totalInvoices = mockInvoices.length;
const totalRevenue = mockInvoices
  .filter(inv => inv.status === 'paid')
  .reduce((sum, inv) => sum + inv.totalAmount, 0);
const pendingInvoices = mockInvoices.filter(inv => inv.status === 'pending').length;
const activeDeliveries = mockDeliveryChallans.filter(dc => dc.status === 'in-transit').length;
const totalEmployees = employeesRaw.length;
const lowStockItems = productsRaw.filter(p => parseFloat(p[5] || 0) <= parseFloat(p[6] || 0)).length;
const pendingPOs = mockPurchaseOrders.filter(po => po.status === 'pending').length;

const mockDashboardSummary = {
  totalCustomers,
  totalInvoices,
  totalRevenue,
  pendingInvoices,
  activeDeliveries,
  totalEmployees,
  lowStockItems,
  pendingPOs
};

// Sales Trend
const monthlyData = {};
mockInvoices.forEach(inv => {
  const date = new Date(inv.invoiceDate);
  if (isNaN(date.getTime())) return;
  const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
  if (!monthlyData[month]) monthlyData[month] = { amount: 0, invoiceCount: 0 };
  monthlyData[month].amount += inv.totalAmount;
  monthlyData[month].invoiceCount += 1;
});
const mockSalesTrend = Object.entries(monthlyData).map(([month, data]) => ({ month, ...data }));

// Recent Activity
const mockRecentActivity = mockInvoices.slice(-5).map(inv => ({
  id: inv.id,
  type: 'invoice',
  description: `Invoice ${inv.invoiceNumber} created (${inv.status})`,
  timestamp: inv.createdAt || new Date().toISOString(),
  user: 'System'
})).reverse();

const content = `export const mockDashboardSummary = ${JSON.stringify(mockDashboardSummary, null, 2)};
export const mockSalesTrend = ${JSON.stringify(mockSalesTrend, null, 2)};
export const mockRecentActivity = ${JSON.stringify(mockRecentActivity, null, 2)};
export const mockCustomers = ${JSON.stringify(mockCustomers, null, 2)};
export const mockInvoices = ${JSON.stringify(mockInvoices, null, 2)};
export const mockPurchaseOrders = ${JSON.stringify(mockPurchaseOrders, null, 2)};
export const mockDeliveryChallans = ${JSON.stringify(mockDeliveryChallans, null, 2)};
`;

fs.writeFileSync('lib/db/src/mockData.ts', content);
console.log('mockData.ts updated with full dump data!');
