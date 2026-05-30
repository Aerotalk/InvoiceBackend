const ChallanModel = require('../models/challanModel');
// Puppeteer dynamically imported in generatePdf
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const createChallan = async (data) => {
    if (!data.challanNumber || !data.customerId || !data.challanDate || data.totalAmount === undefined || !data.userId) {
        throw new Error('Challan Number, Customer, Challan Date, Total Amount, and User ID are required');
    }

    const { items, ...challanData } = data;

    const prismaCreateData = {
        ...challanData,
        challanDate: new Date(data.challanDate),
        items: items && items.length > 0 ? {
            create: items.map(item => ({
                productId: item.productId,
                customDetails: item.customDetails,
                quantity: parseFloat(item.quantity || 0),
                rate: parseFloat(item.rate || 0),
                amount: parseFloat(item.amount || 0)
            }))
        } : undefined
    };

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

    const data = {
        challanNumber: challan.challanNumber,
        referenceNumber: challan.referenceNumber,
        challanDate: challan.challanDate.toLocaleDateString('en-GB'),
        transportMode: challan.transportMode || 'N/A',
        deliveryLocation: challan.deliveryLocation || 'N/A',
        euPoWoNumber: challan.euPoWoNumber || 'N/A',
        
        customer: challan.customer,
        
        items: challan.items.map((item, index) => ({
            index: index + 1,
            name: item.product ? item.product.name : (item.customDetails || 'Custom Item'),
            description: item.product ? item.product.description : '',
            hsn: item.product ? (item.product.hsnCode || '-') : '-',
            quantity: item.quantity,
            unit: item.product ? (item.product.unit || 'Nos') : 'Nos'
        })),
        totalQuantity,
        termsConditions: challan.termsConditions,
        customerNotes: challan.customerNotes
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
    createChallan,
    getChallansByUser,
    getChallanById,
    generatePdf
};
