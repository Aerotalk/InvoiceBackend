const prisma = require('../models/index');
const AppError = require('../utils/AppError');

const createPurchaseOrder = async (userId, data) => {
    const {
        purchaseOrderId, vendorId, date, dueDate, placeOfSupply, 
        transportMode, deliveryLocation, euPoWoNumber, projectId, termsAndConditions,
        subtotal, taxAmount, totalAmount, advance, balance, status, items
    } = data;

    // Check if purchaseOrderId already exists for this user
    const existing = await prisma.purchaseOrder.findFirst({
        where: { purchaseOrderId, userId }
    });
    if (existing) {
        throw new AppError(`Purchase Order with number ${purchaseOrderId} already exists.`, 400);
    }

    const payload = {
        userId,
        purchaseOrderId,
        vendorId,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        placeOfSupply: placeOfSupply || null,
        transportMode: transportMode || null,
        deliveryLocation: deliveryLocation || null,
        euPoWoNumber: euPoWoNumber || null,
        projectId: projectId || null,
        termsAndConditions: termsAndConditions || null,
        subtotal,
        taxAmount: taxAmount || 0,
        totalAmount,
        advance: advance || 0,
        balance: balance || totalAmount,
        status: status || 'draft',
        items: {
            create: items.map(item => ({
                productId: item.productId === 'custom' || !item.productId ? null : item.productId,
                name: item.name,
                hsnSac: item.hsnSac || null,
                quantity: Number(item.quantity) || 0,
                unit: item.unit || 'Nos',
                price: Number(item.price) || 0,
                taxableAmount: Number(item.taxableAmount) || 0,
                gstRate: Number(item.gstRate) || 0,
                gstAmount: Number(item.gstAmount) || 0,
                total: Number(item.total) || 0
            }))
        }
    };

    return await prisma.purchaseOrder.create({
        data: payload,
        include: {
            items: true
        }
    });
};

const getPurchaseOrders = async (userId) => {
    return await prisma.purchaseOrder.findMany({
        where: { userId },
        include: {
            vendor: true,
            project: true
        },
        orderBy: { createdAt: 'desc' }
    });
};

const getPurchaseOrderById = async (userId, id) => {
    const po = await prisma.purchaseOrder.findFirst({
        where: { id, userId },
        include: {
            items: true,
            vendor: true,
            project: true
        }
    });

    if (!po) {
        throw new AppError("Purchase Order not found", 404);
    }
    return po;
};

const updatePurchaseOrder = async (userId, id, data) => {
    const existing = await prisma.purchaseOrder.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        throw new AppError("Purchase Order not found", 404);
    }

    const {
        purchaseOrderId, vendorId, date, dueDate, placeOfSupply, 
        transportMode, deliveryLocation, euPoWoNumber, projectId, termsAndConditions,
        subtotal, taxAmount, totalAmount, advance, balance, status, items
    } = data;

    // Use transaction to delete old items and recreate new ones
    return await prisma.$transaction(async (tx) => {
        // Delete existing items
        await tx.purchaseOrderItem.deleteMany({
            where: { purchaseOrderId: id }
        });

        // Update PO and create new items
        return await tx.purchaseOrder.update({
            where: { id },
            data: {
                purchaseOrderId,
                vendorId,
                date: new Date(date),
                dueDate: dueDate ? new Date(dueDate) : null,
                placeOfSupply: placeOfSupply || null,
                transportMode: transportMode || null,
                deliveryLocation: deliveryLocation || null,
                euPoWoNumber: euPoWoNumber || null,
                projectId: projectId || null,
                termsAndConditions: termsAndConditions || null,
                subtotal,
                taxAmount: taxAmount || 0,
                totalAmount,
                advance: advance || existing.advance,
                balance: balance || existing.balance,
                status: status || existing.status,
                items: {
                    create: items.map(item => ({
                        productId: item.productId === 'custom' || !item.productId ? null : item.productId,
                        name: item.name,
                        hsnSac: item.hsnSac || null,
                        quantity: Number(item.quantity) || 0,
                        unit: item.unit || 'Nos',
                        price: Number(item.price) || 0,
                        taxableAmount: Number(item.taxableAmount) || 0,
                        gstRate: Number(item.gstRate) || 0,
                        gstAmount: Number(item.gstAmount) || 0,
                        total: Number(item.total) || 0
                    }))
                }
            },
            include: {
                items: true
            }
        });
    });
};

const deletePurchaseOrder = async (userId, id) => {
    const existing = await prisma.purchaseOrder.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        throw new AppError("Purchase Order not found", 404);
    }

    await prisma.purchaseOrder.delete({
        where: { id }
    });

    return { message: "Purchase Order deleted successfully" };
};

const generatePdf = async (userId, id) => {
    const po = await getPurchaseOrderById(userId, id);
    const path = require('path');
    const fs = require('fs');
    const handlebars = require('handlebars');
    
    const templatePath = path.join(__dirname, '../templates/purchaseOrderTemplate.hbs');
    if (!fs.existsSync(templatePath)) {
        throw new AppError('Template not found', 500);
    }
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateHtml);
    
    // Prepare data
    const totalQuantity = po.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalTax = po.taxAmount || 0;
    
    const toWords = require('number-to-words');
    const amountInWords = (toWords.toWords(Math.floor(po.totalAmount)) + ' rupees only').replace(/(^\w|\s\w)/g, m => m.toUpperCase());

    // Read logo from file (templates/logo/logo.png)
    const logoPath = path.join(__dirname, '../templates/logo/logo.png');
    const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString('base64') : '';

    // Fetch user settings for company details
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Parse billing addresses from settings (stored as array of strings)
    let billingAddressLine = '';
    if (settings && settings.billingAddresses && settings.billingAddresses.length > 0) {
        try {
            const addrObj = JSON.parse(settings.billingAddresses[0]);
            billingAddressLine = [addrObj.street1, addrObj.street2, addrObj.city, addrObj.state, addrObj.zip].filter(Boolean).join(', ');
        } catch(e) {
            billingAddressLine = settings.billingAddresses[0] || '';
        }
    }

    const companyName = (settings && settings.workspaceBrandName) || (user && user.companyName) || 'GRIVETY GLOBAL PRIVATE LIMITED';

    const data = {
        logoUrl: `data:image/png;base64,${logoBase64}`,
        companyName,
        companyAddress: billingAddressLine || 'Disha Apartment, Flat No. 2, Ground Floor, DA-4/13, Deshbandhu Nagar, Joramondir, Baguiati, VIP Road, Kolkata-700059',
        companyPhone: '033 40037666',
        companyEmail: (user && user.email) || 'info@grivetyglobal.com',
        companyGstin: '19AAHCG8472G1Z6',
        companyState: '19-West Bengal',
        companyPan: 'AAHCG8472G',
        bankName: 'Axis Bank Ltd',
        bankAccountNo: '926020010304892',
        bankIfsc: 'UTIB0005408',
        bankAccountHolder: companyName,
        
        purchaseOrderId: po.purchaseOrderId,
        date: po.date.toLocaleDateString('en-GB').replace(/\//g, '/'),
        dueDate: po.dueDate ? po.dueDate.toLocaleDateString('en-GB').replace(/\//g, '/') : '',
        vendor: po.vendor,
        vendorCompanySnapshot: po.vendorCompanySnapshot || (po.vendor && (po.vendor.companyName || po.vendor.displayName)) || '',
        vendorNameSnapshot: po.vendorNameSnapshot || (po.vendor && po.vendor.displayName) || '',
        placeOfSupply: po.placeOfSupply || '',
        transportMode: po.transportMode || '',
        deliveryLocation: po.deliveryLocation || '',
        euPoWoNumber: po.euPoWoNumber || '',
        items: po.items.map((item, index) => ({
            index: index + 1,
            name: item.name || 'Custom Item',
            hsnSac: item.hsnSac || '',
            quantity: item.quantity,
            unit: item.unit || 'Nos',
            rate: item.price.toFixed(2),
            taxableAmount: item.taxableAmount.toFixed(2),
            gstRate: item.gstRate || 0,
            gstAmount: item.gstAmount.toFixed(2),
            total: item.total.toFixed(2)
        })),
        totalQuantity,
        subTotal: po.subtotal.toFixed(2),
        totalTax: Number(totalTax).toFixed(2),
        sgst: (Number(totalTax) / 2).toFixed(2),
        cgst: (Number(totalTax) / 2).toFixed(2),
        totalAmount: po.totalAmount.toFixed(2),
        totalAmountInWords: amountInWords,
        termsAndConditions: po.termsAndConditions || ''
    };

    const finalHtml = template(data);

    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;

    const browser = await puppeteer.launch({
        headless: "new",
        
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
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
    generatePdf
};
