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
            items: true,
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

module.exports = {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation
};
