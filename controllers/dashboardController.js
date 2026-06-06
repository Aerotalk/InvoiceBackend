const asyncHandler = require('../utils/asyncHandler');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

const getDashboardStats = asyncHandler(async (req, res, next) => {
    logger.info(`📊 Fetching Dashboard Stats for user ${req.user.id}...`);
    const userId = req.user.id;

    const [quotations, expenses, customers] = await Promise.all([
        prisma.quotation.findMany({ where: { userId } }),
        prisma.expense.findMany({ where: { userId } }),
        prisma.customer.findMany({ 
            where: { userId },
            include: { quotations: true, expenses: true }
        })
    ]);

    // Calculate stats
    const totalRevenue = quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
    const paidInvoicesCount = quotations.filter(q => q.status === 'paid' || q.status === 'accepted').length;
    const overdueInvoicesCount = quotations.filter(q => q.status === 'overdue' || q.status === 'expired').length;
    const outstandingInvoices = quotations.filter(q => q.status === 'draft' || q.status === 'sent').length;

    // Monthly Earnings (Last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map();
    
    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${months[d.getMonth()]}-${d.getFullYear()}`;
        monthlyMap.set(key, { name: months[d.getMonth()], revenue: 0, expenses: 0, tax: 0, sortKey: d.getTime() });
    }

    quotations.forEach(q => {
        if (!q.quoteDate) return;
        const d = new Date(q.quoteDate);
        const key = `${months[d.getMonth()]}-${d.getFullYear()}`;
        if (monthlyMap.has(key)) {
            monthlyMap.get(key).revenue += (q.totalAmount || 0);
        }
    });

    expenses.forEach(e => {
        if (!e.date) return;
        const d = new Date(e.date);
        const key = `${months[d.getMonth()]}-${d.getFullYear()}`;
        if (monthlyMap.has(key)) {
            monthlyMap.get(key).expenses += (e.amount || 0);
            monthlyMap.get(key).tax += (e.taxAmount || 0);
        }
    });

    const monthlyEarnings = Array.from(monthlyMap.values()).sort((a, b) => a.sortKey - b.sortKey);

    // Status Pie Data
    const statusMap = {};
    quotations.forEach(q => {
        const status = q.status || 'draft';
        statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const statusPieData = Object.keys(statusMap).map(status => ({
        name: status,
        value: statusMap[status]
    }));

    // Client Profitability Matrix
    const clientProfitabilityData = customers.map(c => {
        const billed = c.quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
        const exp = c.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const profit = billed - exp;
        const margin = billed > 0 ? Math.round((profit / billed) * 100) : 0;

        return {
            client: c.displayName,
            company: c.companyName || 'N/A',
            billed,
            expenses: exp,
            profit,
            margin
        };
    }).sort((a, b) => b.profit - a.profit).slice(0, 5); // top 5

    const recentInvoices = quotations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const recentPayments = expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    res.status(200).json({
        success: true,
        data: {
            stats: { totalRevenue, outstandingInvoices, paidInvoicesCount, overdueInvoicesCount },
            monthlyEarnings,
            statusPieData,
            clientProfitabilityData,
            recentInvoices,
            recentPayments
        }
    });
});

module.exports = { getDashboardStats };
