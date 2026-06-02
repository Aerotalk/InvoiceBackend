const request = require('supertest');
const app = require('../server'); // ensure server exports app
const prisma = require('../models/index');
const jwt = require('jsonwebtoken');
require('dotenv').config();

describe('Expense API Endpoints', () => {
    let token;
    let userId;

    beforeAll(async () => {
        // Create a test user for auth
        const testUser = await prisma.user.create({
            data: {
                email: 'test_expense_user@example.com',
                password: 'password123',
                accountType: 'INDIVIDUAL',
                fullName: 'Test Expense User',
                phoneCode: '+1',
                phoneNumber: '1234567890',
                country: 'US',
                state: 'NY',
                city: 'New York'
            }
        });
        userId = testUser.id;
        token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    afterAll(async () => {
        await prisma.expense.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        await prisma.$disconnect();
    });

    it('should create a new expense', async () => {
        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send({
                description: 'Office Supplies',
                category: 'Equipment',
                amount: 150.00,
                currency: 'USD',
                date: new Date().toISOString(),
                notes: 'Pens and paper',
                receiptUrl: 'https://example.com/receipt.pdf'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.description).toBe('Office Supplies');
    });

    it('should fetch all expenses for the user', async () => {
        const res = await request(app)
            .get('/api/expenses')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
});
