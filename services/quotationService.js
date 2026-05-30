const QuotationModel = require('../models/quotationModel');
// Puppeteer dynamically imported in generatePdf
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const createQuotation = async (data) => {
    if (!data.quoteNumber || !data.customerId || !data.quoteDate || data.totalAmount === undefined || !data.userId) {
        throw new Error('Quote Number, Customer, Quote Date, Total Amount, and User ID are required');
    }

    const { items, ...quotationData } = data;

    const prismaCreateData = {
        ...quotationData,
        quoteDate: new Date(data.quoteDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        items: items && items.length > 0 ? {
            create: items.map(item => ({
                productId: item.productId,
                customDetails: item.customDetails,
                quantity: parseFloat(item.quantity || 0),
                rate: parseFloat(item.rate || 0),
                tax: item.tax,
                amount: parseFloat(item.amount || 0)
            }))
        } : undefined
    };

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
            hsn: item.product ? (item.product.hsnCode || '-') : '-',
            quantity: item.quantity,
            unit: item.product ? (item.product.unit || 'Nos') : 'Nos',
            rate: item.rate.toFixed(2),
            taxableAmount: (item.quantity * item.rate).toFixed(2),
            tax: item.tax || '0%',
            amount: item.amount.toFixed(2)
        })),
        subTotal: quotation.subTotal.toFixed(2),
        totalAmount: quotation.totalAmount.toFixed(2),
        termsConditions: quotation.termsConditions,
        customerNotes: quotation.customerNotes,
        
        totalTax: (quotation.totalAmount - quotation.subTotal).toFixed(2),
        sgst: ((quotation.totalAmount - quotation.subTotal) / 2).toFixed(2),
        cgst: ((quotation.totalAmount - quotation.subTotal) / 2).toFixed(2),
        totalAmountInWords: "Two Lakh Fifty Thousand Seven Hundred Fifty Rupees only" // Placeholder
    };

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

module.exports = {
    createQuotation,
    getQuotationsByUser,
    getQuotationById,
    generatePdf
};
