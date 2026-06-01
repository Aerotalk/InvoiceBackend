const ChallanModel = require('../models/challanModel');
// Puppeteer dynamically imported in generatePdf
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const calculationUtils = require('../utils/calculationUtils');

const createChallan = async (data) => {
    if (!data.challanNumber || !data.customerId || !data.challanDate || !data.userId) {
        throw new Error('Challan Number, Customer, Challan Date, and User ID are required');
    }

    const prismaCreateData = {
        challanNumber: data.challanNumber,
        referenceNumber: data.referenceNumber || null,
        customerId: data.customerId,
        userId: data.userId,
        challanDate: new Date(data.challanDate),
        challanType: data.challanType || null,
        customerNotes: data.customerNotes || null,
        termsConditions: data.termsConditions || null,
        
        subTotal: parseFloat(data.subTotal || 0),
        discountType: data.discountType || null,
        discountValue: parseFloat(data.discountValue || 0),
        adjustment: parseFloat(data.adjustment || 0),
        totalAmount: parseFloat(data.totalAmount || 0),
        
        transportMode: data.transportMode || null,
        deliveryLocation: data.deliveryLocation || null,
        euPoWoNumber: data.euPoWoNumber || null,
        signatureUrl: data.signatureUrl || null,
        items: data.items && data.items.length > 0 ? {
            create: data.items.map(item => {
                const calcs = calculationUtils.calculateLineItem(item.quantity, item.rate, item.tax);
                return {
                    productId: item.productId,
                    customDetails: item.customDetails,
                    quantity: parseFloat(item.quantity || 0),
                    rate: parseFloat(item.rate || 0),
                    tax: item.tax,
                    taxAmount: calcs.taxAmount,
                    amount: calcs.amount
                };
            })
        } : undefined
    };

    // Recalculate totals properly
    if (prismaCreateData.items && prismaCreateData.items.create) {
        const totals = calculationUtils.calculateDocumentTotals(
            prismaCreateData.items.create,
            prismaCreateData.discountValue,
            prismaCreateData.discountType,
            prismaCreateData.adjustment
        );
        prismaCreateData.subTotal = totals.subTotal;
        prismaCreateData.totalAmount = totals.totalAmount;
    }

    return await ChallanModel.createChallan(prismaCreateData);
};

const getChallansByUser = async (userId) => {
    return await ChallanModel.findAllChallans(userId);
};

const getChallanById = async (id) => {
    const challan = await ChallanModel.findChallanById(id);
    if (!challan) throw new Error('Delivery Challan not found');
    return challan;
};

const generatePdf = async (id) => {
    const challan = await getChallanById(id);

    const templatePath = path.join(__dirname, '../templates/challanTemplate.hbs');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    const template = handlebars.compile(templateHtml);

    const totalQuantity = challan.items.reduce((acc, item) => acc + item.quantity, 0);

    const numberToWords = (amount) => {
        if (amount === 0) return "Zero Rupees only";
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const inWords = (num) => {
            if ((num = num.toString()).length > 9) return 'overflow';
            const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return '';
            let str = '';
            str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
            str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
            str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
            str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
            str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
            return str.trim();
        };
        const parts = amount.toString().split('.');
        const rupees = parseInt(parts[0], 10);
        const paise = parts.length > 1 ? parseInt(parts[1].padEnd(2, '0').substring(0,2), 10) : 0;
        let result = inWords(rupees) + ' Rupees';
        if (paise > 0) result += ' and ' + inWords(paise) + ' Paise';
        return result + ' only';
    };

    const data = {
        challanNumber: challan.challanNumber,
        referenceNumber: challan.referenceNumber,
        challanDate: challan.challanDate.toLocaleDateString('en-GB'),
        transportMode: challan.transportMode || 'N/A',
        customer: challan.customer,
        
        items: challan.items.map((item, index) => ({
            index: index + 1,
            name: item.product ? item.product.name : (item.customDetails || 'Custom Item'),
            description: item.customDetails || (item.product ? item.product.description : ''),
            hsn: item.product ? (item.product.hsnCode || '-') : '-',
            quantity: item.quantity,
            unit: item.product ? (item.product.unit || 'Nos') : 'Nos',
            rate: item.rate.toFixed(2),
            taxableAmount: (item.quantity * item.rate).toFixed(2),
            tax: item.tax || '0%',
            amount: item.amount.toFixed(2)
        })),
        totalQuantity,
        subTotal: challan.subTotal.toFixed(2),
        totalAmount: challan.totalAmount.toFixed(2),
        termsConditions: challan.termsConditions,
        customerNotes: challan.customerNotes,
        
        totalTax: (challan.totalAmount - challan.subTotal + (challan.discountValue || 0) - (challan.adjustment || 0)).toFixed(2),
        sgst: calculationUtils.calculateTaxSplit((challan.totalAmount - challan.subTotal + (challan.discountValue || 0) - (challan.adjustment || 0))).sgst.toFixed(2),
        cgst: calculationUtils.calculateTaxSplit((challan.totalAmount - challan.subTotal + (challan.discountValue || 0) - (challan.adjustment || 0))).cgst.toFixed(2),
        totalAmountInWords: numberToWords(challan.totalAmount),
        signatureUrl: challan.signatureUrl
    };

    // Better tax logic based on stored line items taxAmount
    const totalTaxAmt = challan.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const taxSplit = calculationUtils.calculateTaxSplit(totalTaxAmt, false); // For now assuming intra-state
    data.totalTax = totalTaxAmt.toFixed(2);
    data.sgst = taxSplit.sgst.toFixed(2);
    data.cgst = taxSplit.cgst.toFixed(2);

    const finalHtml = template(data);

    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '30px', right: '30px', bottom: '30px', left: '30px' }
    });
    
    await browser.close();

    return pdfBuffer;
};

const updateChallan = async (id, updates) => {
    // If items are being updated, we should recalculate
    if (updates.items) {
        updates.items = updates.items.map(item => {
            const calcs = calculationUtils.calculateLineItem(item.quantity, item.rate, item.tax);
            return {
                ...item,
                taxAmount: calcs.taxAmount,
                amount: calcs.amount
            };
        });
        const totals = calculationUtils.calculateDocumentTotals(
            updates.items,
            updates.discountValue || 0,
            updates.discountType,
            updates.adjustment || 0
        );
        updates.subTotal = totals.subTotal;
        updates.totalAmount = totals.totalAmount;
    }
    return await ChallanModel.updateChallan(id, updates);
};

const deleteChallan = async (id) => {
    return await ChallanModel.deleteChallan({ id });
};

module.exports = {
    createChallan,
    getChallansByUser,
    getChallanById,
    generatePdf,
    updateChallan,
    deleteChallan
};
