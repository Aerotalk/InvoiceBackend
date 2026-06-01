const QuotationModel = require('../models/quotationModel');
// Puppeteer dynamically imported in generatePdf
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const calculationUtils = require('../utils/calculationUtils');

const createQuotation = async (data) => {
    if (!data.quoteNumber || !data.customerId || !data.quoteDate || data.totalAmount === undefined || !data.userId) {
        throw new Error('Quote Number, Customer, Quote Date, Total Amount, and User ID are required');
    }

    const prismaCreateData = {
        quoteNumber: data.quoteNumber,
        referenceNumber: data.referenceNumber || null,
        customerId: data.customerId,
        projectId: data.projectId || null,
        userId: data.userId,
        quoteDate: new Date(data.quoteDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        salesperson: data.salesperson || null,
        subject: data.subject || null,
        customerNotes: data.customerNotes || null,
        termsConditions: data.termsConditions || null,
        
        subTotal: parseFloat(data.subTotal || 0),
        discountType: data.discountType || (data.discountRate ? 'percentage' : null),
        discountValue: parseFloat(data.discountValue || data.discountRate || 0),
        tdsTcs: data.tdsTcs || null,
        adjustment: parseFloat(data.adjustment || 0),
        totalAmount: parseFloat(data.totalAmount || 0),
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

    return await QuotationModel.createQuotation(prismaCreateData);
};

const getQuotationsByUser = async (userId) => {
    return await QuotationModel.findAllQuotations(userId);
};

const getQuotationById = async (id) => {
    const quotation = await QuotationModel.findQuotationById(id);
    if (!quotation) throw new Error('Quotation not found');
    return quotation;
};

const generatePdf = async (id) => {
    const quotation = await getQuotationById(id);

    const templatePath = path.join(__dirname, '../templates/quotationTemplate.hbs');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    const template = handlebars.compile(templateHtml);

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
        quoteNumber: quotation.quoteNumber,
        referenceNumber: quotation.referenceNumber,
        quoteDate: quotation.quoteDate.toLocaleDateString('en-GB'),
        expiryDate: quotation.expiryDate ? quotation.expiryDate.toLocaleDateString('en-GB') : 'N/A',
        customer: quotation.customer,
        project: quotation.project,
        items: quotation.items.map((item, index) => ({
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
        totalQuantity: quotation.items.reduce((sum, item) => sum + item.quantity, 0),
        subTotal: quotation.subTotal.toFixed(2),
        totalAmount: quotation.totalAmount.toFixed(2),
        termsConditions: quotation.termsConditions,
        customerNotes: quotation.customerNotes,
        
        totalTax: (quotation.totalAmount - quotation.subTotal + (quotation.discountValue || 0) - (quotation.adjustment || 0)).toFixed(2),
        sgst: calculationUtils.calculateTaxSplit((quotation.totalAmount - quotation.subTotal + (quotation.discountValue || 0) - (quotation.adjustment || 0))).sgst.toFixed(2),
        cgst: calculationUtils.calculateTaxSplit((quotation.totalAmount - quotation.subTotal + (quotation.discountValue || 0) - (quotation.adjustment || 0))).cgst.toFixed(2),
        totalAmountInWords: numberToWords(quotation.totalAmount),
        signatureUrl: quotation.signatureUrl
    };

    const totalTaxAmt = quotation.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const taxSplit = calculationUtils.calculateTaxSplit(totalTaxAmt, false);
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

const updateQuotation = async (id, updates) => {
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
    return await QuotationModel.updateQuotation(id, updates);
};

const deleteQuotation = async (id) => {
    return await QuotationModel.deleteQuotation({ id });
};

module.exports = {
    createQuotation,
    getQuotationsByUser,
    getQuotationById,
    generatePdf,
    updateQuotation,
    deleteQuotation
};
