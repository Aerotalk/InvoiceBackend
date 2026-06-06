const asyncHandler = require('../utils/asyncHandler');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

const getDashboardStats = asyncHandler(async (req, res, next) => {
    logger.info(`📊 Fetching Dashboard Stats for user ${req.user.id}...`);
    const userId = req.user.id;

    const [quotations, expenses, projects] = await Promise.all([
        prisma.quotation.findMany({ where: { userId } }),
        prisma.expense.findMany({ where: { userId } }),
        prisma.project.findMany({ 
            where: { userId },
            include: { quotations: true, expenses: true, customer: true }
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
    
    const colors = {
        'paid': '#10b981',
        'accepted': '#10b981',
        'draft': '#94a3b8',
        'sent': '#3b82f6',
        'overdue': '#ef4444',
        'expired': '#ef4444'
    };

    const statusPieData = Object.keys(statusMap).map(status => ({
        name: status,
        value: statusMap[status],
        color: colors[status.toLowerCase()] || '#f59e0b'
    }));

    // Client Profitability Matrix
    const customerMap = new Map();
    projects.forEach(p => {
        if (!p.customer) return;
        const cid = p.customerId;
        if (!customerMap.has(cid)) {
            customerMap.set(cid, {
                client: p.customer.displayName,
                company: p.customer.companyName || 'N/A',
                billed: 0,
                expenses: 0
            });
        }
        const stat = customerMap.get(cid);
        stat.billed += p.quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
        stat.expenses += p.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    });

    const clientProfitabilityData = Array.from(customerMap.values()).map(c => {
        const profit = c.billed - c.expenses;
        const margin = c.billed > 0 ? Math.round((profit / c.billed) * 100) : 0;
        return { ...c, profit, margin };
    }).sort((a, b) => b.profit - a.profit).slice(0, 5);

    const recentInvoices = quotations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(q => ({
            id: q.id,
            invoiceNumber: q.quoteNumber,
            clientCompany: q.clientCompanySnapshot || q.clientNameSnapshot || 'Unknown Client',
            total: q.totalAmount,
            currency: 'INR',
            status: q.status,
            issueDate: q.quoteDate
        }));

    const recentPayments = expenses
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(e => ({
            id: e.id,
            clientName: e.description || e.category || 'Expense',
            method: e.category || 'Bank_Transfer',
            amount: e.amount,
            currency: e.currency || 'INR',
            date: e.date
        }));

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
