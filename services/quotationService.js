const prisma = require('../models/index');
const AppError = require('../utils/AppError');

const createQuotation = async (userId, data) => {
    const {
        quoteNumber, referenceNumber, clientId, clientName, clientCompany,
        quoteDate, expiryDate, salesperson, projectId, projectName,
        subject, items, subtotal, discountRate, taxType, taxRate, taxAmount,
        adjustment, total, status, customerNotes, terms, signatureUrl
    } = data;

    // Check if quoteNumber already exists for this user
    const existing = await prisma.quotation.findFirst({
        where: { quoteNumber, userId }
    });
    if (existing) {
        throw new AppError(`Quotation with number ${quoteNumber} already exists.`, 400);
    }

    const payload = {
        userId,
        quoteNumber,
        referenceNumber: referenceNumber || null,
        customerId: clientId,
        clientNameSnapshot: clientName || null,
        clientCompanySnapshot: clientCompany || null,
        quoteDate: new Date(quoteDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        salesperson: salesperson || null,
        projectId: projectId || null,
        projectNameSnapshot: projectName || null,
        subject: subject || null,
        subTotal: subtotal,
        discountValue: discountRate,
        tdsTcs: taxType,
        taxRate: taxRate,
        taxAmount: taxAmount || 0,
        adjustment: adjustment,
        totalAmount: total,
        status: status || 'draft',
        customerNotes: customerNotes || null,
        termsConditions: terms || null,
        signatureUrl: signatureUrl || null,
        items: {
            create: items.map(item => ({
                productId: item.productId === 'custom' || !item.productId ? null : item.productId,
                productNameSnapshot: item.name,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.total
            }))
        }
    };

    return await prisma.quotation.create({
        data: payload,
        include: {
            items: true
        }
    });
};

const getQuotations = async (userId) => {
    return await prisma.quotation.findMany({
        where: { userId },
        include: {
            customer: true,
            project: true
        },
        orderBy: { createdAt: 'desc' }
    });
};

const getQuotationById = async (userId, id) => {
    const quote = await prisma.quotation.findFirst({
        where: { id, userId },
        include: {
            items: {
                include: { product: true }
            },
            customer: true,
            project: true
        }
    });

    if (!quote) {
        throw new AppError("Quotation not found", 404);
    }
    return quote;
};

const updateQuotation = async (userId, id, data) => {
    const existing = await prisma.quotation.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        throw new AppError("Quotation not found", 404);
    }

    const {
        quoteNumber, referenceNumber, clientId, clientName, clientCompany,
        quoteDate, expiryDate, salesperson, projectId, projectName,
        subject, items, subtotal, discountRate, taxType, taxRate, taxAmount,
        adjustment, total, status, customerNotes, terms, signatureUrl
    } = data;

    // Use transaction to delete old items and recreate new ones
    return await prisma.$transaction(async (tx) => {
        // Delete existing items
        await tx.quotationItem.deleteMany({
            where: { quotationId: id }
        });

        // Update quote and create new items
        return await tx.quotation.update({
            where: { id },
            data: {
                quoteNumber,
                referenceNumber: referenceNumber || null,
                customerId: clientId,
                clientNameSnapshot: clientName || null,
                clientCompanySnapshot: clientCompany || null,
                quoteDate: new Date(quoteDate),
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                salesperson: salesperson || null,
                projectId: projectId || null,
                projectNameSnapshot: projectName || null,
                subject: subject || null,
                subTotal: subtotal,
                discountValue: discountRate,
                tdsTcs: taxType,
                taxRate: taxRate,
                taxAmount: taxAmount || 0,
                adjustment: adjustment,
                totalAmount: total,
                status: status || existing.status,
                customerNotes: customerNotes || null,
                termsConditions: terms || null,
                signatureUrl: signatureUrl || null,
                items: {
                    create: items.map(item => ({
                        productId: item.productId === 'custom' || !item.productId ? null : item.productId,
                        productNameSnapshot: item.name,
                        quantity: item.quantity,
                        rate: item.rate,
                        amount: item.total
                    }))
                }
            },
            include: {
                items: true
            }
        });
    });
};

const deleteQuotation = async (userId, id) => {
    const existing = await prisma.quotation.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        throw new AppError("Quotation not found", 404);
    }

    await prisma.quotation.delete({
        where: { id }
    });

    return { message: "Quotation deleted successfully" };
};

const generatePdf = async (userId, id) => {
    const quotation = await getQuotationById(userId, id);
    const path = require('path');
    const fs = require('fs');
    const handlebars = require('handlebars');
    
    const templatePath = path.join(__dirname, '../templates/quotationTemplate.hbs');
    if (!fs.existsSync(templatePath)) {
        throw new AppError('Template not found', 500);
    }
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateHtml);
    
    // Prepare data
    const totalQuantity = quotation.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalTax = quotation.taxAmount || 0;
    
    const toWords = require('number-to-words');
    const amountInWords = (toWords.toWords(Math.floor(quotation.totalAmount)) + ' rupees only').replace(/(^\w|\s\w)/g, m => m.toUpperCase());

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
        // Company details from settings
        companyName,
        companyAddress: billingAddressLine || 'Disha Apartment, Flat No. 2, Ground Floor, DA-4/13, Deshbandhu Nagar, Joramondir, Baguiati, VIP Road, Kolkata-700059',
        companyPhone: '033 40037666',
        companyEmail: (user && user.email) || 'info@grivetyglobal.com',
        companyGstin: '19AAHCG8472G1Z6',
        companyState: '19-West Bengal',
        companyPan: 'AAHCG8472G',
        // Bank details
        bankName: 'Axis Bank Ltd',
        bankAccountNo: '926020010304892',
        bankIfsc: 'UTIB0005408',
        bankAccountHolder: companyName,
        // Quote fields
        quoteNumber: quotation.quoteNumber,
        quoteDate: quotation.quoteDate.toLocaleDateString('en-GB').replace(/\//g, '/'),
        expiryDate: quotation.expiryDate ? quotation.expiryDate.toLocaleDateString('en-GB').replace(/\//g, '/') : '',
        customer: quotation.customer,
        clientCompanySnapshot: quotation.clientCompanySnapshot || (quotation.customer && (quotation.customer.companyName || quotation.customer.displayName)) || '',
        clientNameSnapshot: quotation.clientNameSnapshot || (quotation.customer && quotation.customer.displayName) || '',
        salespersonName: quotation.salesperson || (settings && settings.adminProfileName) || (user && user.fullName) || 'Dipa Dey',
        salespersonEmail: (settings && settings.billingEmailContact) || (user && user.email) || 'dipa@grivetyglobal.com',
        salespersonMobile: (user && user.phoneNumber) ? `${user.phoneCode || ''}${user.phoneNumber}` : '+91 7605084372',
        items: quotation.items.map((item, index) => ({
            index: index + 1,
            name: item.productNameSnapshot || 'Custom Item',
            description: item.customDetails || '',
            hsn: item.product ? item.product.hsnCode : '',
            unit: (item.product && item.product.unit) || 'Nos',
            quantity: item.quantity,
            rate: item.rate.toFixed(2),
            taxableAmount: (item.quantity * item.rate).toFixed(2),
            tax: item.tax || (quotation.taxRate || 18),
            taxAmount: item.taxAmount ? item.taxAmount.toFixed(2) : ((item.quantity * item.rate) * (quotation.taxRate || 18) / 100).toFixed(2),
            amount: item.amount.toFixed(2)
        })),
        totalQuantity,
        subTotal: quotation.subTotal.toFixed(2),
        totalTax: Number(totalTax).toFixed(2),
        sgst: (Number(totalTax) / 2).toFixed(2),
        cgst: (Number(totalTax) / 2).toFixed(2),
        totalAmount: quotation.totalAmount.toFixed(2),
        totalAmountInWords: amountInWords,
        termsConditions: quotation.termsConditions || '',
        customerNotes: quotation.customerNotes,
        signatureUrl: quotation.signatureUrl
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
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    generatePdf
};
