const prisma = require('../models/index');
const ChallanModel = require('../models/challanModel');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');

const createChallan = async (data) => {
    // Determine the items array structure
    const itemsData = data.items.map(item => ({
        productId: item.productId === 'custom' ? null : item.productId,
        productNameSnapshot: item.name,
        customDetails: item.name,
        quantity: item.quantity,
        rate: item.rate,
        tax: item.tax || null,
        taxAmount: item.taxAmount || 0,
        amount: item.total || item.amount || (item.quantity * item.rate)
    }));

    const createData = {
        challanNumber: data.challanNumber,
        referenceNumber: data.referenceNumber,
        challanDate: new Date(data.challanDate),
        challanType: data.challanType,
        status: data.status || 'draft',
        
        clientNameSnapshot: data.clientName,
        clientCompanySnapshot: data.clientCompany,
        
        customerNotes: data.customerNotes,
        termsConditions: data.terms,
        signatureUrl: data.signatureUrl,
        
        subTotal: data.subtotal || data.subTotal,
        discountValue: data.discountRate || data.discountValue || 0,
        discountType: 'PERCENTAGE', // Assuming rate means percentage
        adjustment: data.adjustment || 0,
        totalAmount: data.total || data.totalAmount,

        customerId: data.clientId || data.customerId,
        userId: data.userId,
        
        items: {
            create: itemsData
        }
    };

    return await ChallanModel.createChallan(createData);
};

const getChallansByUser = async (userId) => {
    return await ChallanModel.findAllChallans(userId);
};

const getChallanById = async (id) => {
    const challan = await ChallanModel.findChallanById(id);
    if (!challan) throw new Error('Delivery Challan not found');
    return challan;
};

const updateChallan = async (id, data) => {
    // Handle item replacement using a transaction
    return await prisma.$transaction(async (tx) => {
        // Prepare the basic update data
        const updateData = {};
        if (data.challanNumber !== undefined) updateData.challanNumber = data.challanNumber;
        if (data.referenceNumber !== undefined) updateData.referenceNumber = data.referenceNumber;
        if (data.challanDate !== undefined) updateData.challanDate = new Date(data.challanDate);
        if (data.challanType !== undefined) updateData.challanType = data.challanType;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.clientName !== undefined) updateData.clientNameSnapshot = data.clientName;
        if (data.clientCompany !== undefined) updateData.clientCompanySnapshot = data.clientCompany;
        if (data.customerNotes !== undefined) updateData.customerNotes = data.customerNotes;
        if (data.terms !== undefined) updateData.termsConditions = data.terms;
        if (data.signatureUrl !== undefined) updateData.signatureUrl = data.signatureUrl;
        if (data.subtotal !== undefined) updateData.subTotal = data.subtotal;
        if (data.discountRate !== undefined) updateData.discountValue = data.discountRate;
        if (data.adjustment !== undefined) updateData.adjustment = data.adjustment;
        if (data.total !== undefined) updateData.totalAmount = data.total;

        // If items are provided, replace them
        if (data.items) {
            // Delete old items
            await tx.deliveryChallanItem.deleteMany({
                where: { deliveryChallanId: id }
            });
            
            // Format new items
            const newItems = data.items.map(item => ({
                deliveryChallanId: id,
                productId: item.productId === 'custom' ? null : item.productId,
                productNameSnapshot: item.name,
                customDetails: item.name,
                quantity: item.quantity,
                rate: item.rate,
                tax: item.tax || null,
                taxAmount: item.taxAmount || 0,
                amount: item.total || item.amount || (item.quantity * item.rate)
            }));
            
            await tx.deliveryChallanItem.createMany({
                data: newItems
            });
        }
        
        return await tx.deliveryChallan.update({
            where: { id },
            data: updateData,
            include: {
                customer: true,
                items: {
                    include: { product: true }
                }
            }
        });
    });
};

const deleteChallan = async (id) => {
    return await prisma.deliveryChallan.delete({
        where: { id }
    });
};

const generatePdf = async (id) => {
    const challan = await getChallanById(id);
    const templatePath = path.join(__dirname, '../templates/challanTemplate.hbs');
    if (!fs.existsSync(templatePath)) {
        throw new Error('Template not found');
    }
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateHtml);
    
    const logoBase64 = require('../utils/logoBase64');
    
        const toWords = require('number-to-words');
        const totalAmountInWords = (toWords.toWords(challan.totalAmount) + ' rupees only').replace(/(^\w|\s\w)/g, m => m.toUpperCase());

        let totalQuantity = 0;
        let totalTax = 0;

        const data = {
            logoUrl: `data:image/png;base64,${logoBase64}`,
            challanNumber: challan.challanNumber,
            referenceNumber: challan.referenceNumber,
            challanDate: challan.challanDate.toLocaleDateString('en-GB'),
            customer: challan.customer,
            clientCompanySnapshot: challan.clientCompanySnapshot,
            clientNameSnapshot: challan.clientNameSnapshot,
            items: challan.items.map((item, index) => {
                totalQuantity += item.quantity;
                totalTax += item.taxAmount;
                const taxableAmount = item.amount - item.taxAmount;
                return {
                    index: index + 1,
                    name: item.productNameSnapshot || (item.product ? item.product.name : 'Custom Item'),
                    hsn: item.product ? item.product.hsn : '',
                    unit: item.product ? item.product.unit : 'pcs',
                    quantity: item.quantity,
                    rate: item.rate.toFixed(2),
                    taxableAmount: taxableAmount.toFixed(2),
                    tax: item.tax ? `${item.tax}%` : '18%',
                    amount: item.amount.toFixed(2)
                };
            }),
            totalQuantity: totalQuantity,
            totalTax: totalTax.toFixed(2),
            sgst: (totalTax / 2).toFixed(2),
            cgst: (totalTax / 2).toFixed(2),
            subTotal: challan.subTotal.toFixed(2),
            totalAmount: challan.totalAmount.toFixed(2),
            totalAmountInWords: totalAmountInWords,
            termsConditions: challan.termsConditions,
            customerNotes: challan.customerNotes,
            signatureUrl: challan.signatureUrl
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
    await page.setContent(finalHtml, { waitUntil: 'load' });
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
    updateChallan,
    deleteChallan,
    generatePdf
};
