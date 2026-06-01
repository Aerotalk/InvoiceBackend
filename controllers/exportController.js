const ExcelJS = require('exceljs');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const challanService = require('../services/challanService');
const quotationService = require('../services/quotationService');
const expenseService = require('../services/expenseService');
const logger = require('../utils/logger');

const exportDataToExcel = asyncHandler(async (req, res, next) => {
    logger.info(`📊 Generating Excel Export for user ${req.user.id}...`);

    const userId = req.user.id;
    
    // Fetch data
    const [challans, quotations, expenses] = await Promise.all([
        challanService.getChallansByUser(userId),
        quotationService.getQuotationsByUser(userId),
        expenseService.getExpenses(userId)
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'InvoiceIQ System';
    workbook.created = new Date();

    // 1. KPIs Sheet
    const kpiSheet = workbook.addWorksheet('KPIs');
    kpiSheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
    ];

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalTaxableExpenses = expenses.reduce((sum, exp) => sum + (exp.taxableAmount || 0), 0);
    const totalExpenseTax = expenses.reduce((sum, exp) => sum + (exp.taxAmount || 0), 0);

    const totalQuotedAmount = quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
    const totalChallanAmount = challans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    kpiSheet.addRows([
        { metric: 'Total Quotations Generated', value: quotations.length },
        { metric: 'Total Delivery Challans Generated', value: challans.length },
        { metric: 'Total Expenses Logged', value: expenses.length },
        { metric: 'Total Quoted Value', value: totalQuotedAmount.toFixed(2) },
        { metric: 'Total Challan Value', value: totalChallanAmount.toFixed(2) },
        { metric: 'Total Expense Amount', value: totalExpenses.toFixed(2) },
        { metric: 'Total Taxable Expense Amount', value: totalTaxableExpenses.toFixed(2) },
        { metric: 'Total Expense Tax Amount', value: totalExpenseTax.toFixed(2) }
    ]);

    // 2. Expenses Sheet
    const expSheet = workbook.addWorksheet('Expenses');
    expSheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Taxable Amount', key: 'taxableAmount', width: 15 },
        { header: 'Tax Amount', key: 'taxAmount', width: 15 },
        { header: 'Currency', key: 'currency', width: 10 },
        { header: 'Description', key: 'description', width: 30 }
    ];
    expenses.forEach(e => {
        expSheet.addRow({
            date: e.date.toISOString().split('T')[0],
            category: e.category,
            amount: e.amount,
            taxableAmount: e.taxableAmount,
            taxAmount: e.taxAmount,
            currency: e.currency,
            description: e.description
        });
    });

    // 3. Quotations Sheet
    const quoteSheet = workbook.addWorksheet('Quotations');
    quoteSheet.columns = [
        { header: 'Quote Number', key: 'quoteNumber', width: 20 },
        { header: 'Date', key: 'quoteDate', width: 15 },
        { header: 'SubTotal', key: 'subTotal', width: 15 },
        { header: 'Discount', key: 'discountValue', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 }
    ];
    quotations.forEach(q => {
        quoteSheet.addRow({
            quoteNumber: q.quoteNumber,
            quoteDate: q.quoteDate.toISOString().split('T')[0],
            subTotal: q.subTotal,
            discountValue: q.discountValue,
            totalAmount: q.totalAmount
        });
    });

    // 4. Challans Sheet
    const challanSheet = workbook.addWorksheet('Delivery Challans');
    challanSheet.columns = [
        { header: 'Challan Number', key: 'challanNumber', width: 20 },
        { header: 'Date', key: 'challanDate', width: 15 },
        { header: 'SubTotal', key: 'subTotal', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 }
    ];
    challans.forEach(c => {
        challanSheet.addRow({
            challanNumber: c.challanNumber,
            challanDate: c.challanDate.toISOString().split('T')[0],
            subTotal: c.subTotal,
            totalAmount: c.totalAmount
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Export_' + new Date().getTime() + '.xlsx');

    await workbook.xlsx.write(res);
    res.end();
});

module.exports = {
    exportDataToExcel
};
