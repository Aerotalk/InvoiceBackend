const request = require('supertest');
const express = require('express');

// Mock auth middleware before requiring routes
jest.mock('../middlewares/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  }
}));

const customerRoutes = require('../routes/customerRoutes');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

jest.setTimeout(30000); // 30 seconds to handle remote db connection

const app = express();
app.use(express.json());

// Mocking the auth middleware to simulate a logged-in user
app.use((req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

app.use('/api/customers', customerRoutes);

describe('Customer API E2E Tests', () => {
  beforeAll(async () => {
    // Setup test user
    await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        id: 'test-user-id',
        accountType: 'BUSINESS',
        email: 'test@example.com',
        password: 'hashedpassword',
        phoneCode: '+1',
        phoneNumber: '1234567890',
        country: 'USA',
        state: 'NY',
        city: 'New York'
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.customer.deleteMany({ where: { userId: 'test-user-id' } });
    await prisma.user.delete({ where: { id: 'test-user-id' } });
    await prisma.$disconnect();
  });

  it('should create a valid business customer', async () => {
    const payload = {
      clientType: 'business',
      displayName: 'Acme Test Corp',
      company: 'Acme Test Corp',
      email: 'acme@example.com',
      currency: 'USD',
      language: 'English',
      gstTreatment: 'Registered Business - Regular',
      gstNumber: '29ABCDE1234F1Z5',
      placeOfSupply: 'New York',
      contactPersons: [
        {
          salutation: 'Mr.',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@acme.com',
          phone: '123-456-7890'
        }
      ]
    };

    const res = await request(app).post('/api/customers').send(payload);
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('Acme Test Corp');
    expect(res.body.data.gstNumber).toBe('29ABCDE1234F1Z5');
  });

  it('should fail if business client is missing company name', async () => {
    const payload = {
      clientType: 'business',
      displayName: 'Invalid Corp',
      email: 'invalid@example.com',
      currency: 'USD',
      language: 'English',
      gstTreatment: 'Consumer',
      placeOfSupply: 'New York'
    };

    const res = await request(app).post('/api/customers').send(payload);
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'company' })
      ])
    );
  });

  it('should fail if registered business is missing gstNumber', async () => {
    const payload = {
      clientType: 'individual',
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      currency: 'USD',
      language: 'English',
      gstTreatment: 'Registered Business - Regular',
      placeOfSupply: 'New York'
    };

    const res = await request(app).post('/api/customers').send(payload);
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'gstNumber' })
      ])
    );
  });

  it('should create an individual customer without gstNumber if Consumer', async () => {
    const payload = {
      clientType: 'individual',
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      currency: 'USD',
      language: 'English',
      gstTreatment: 'Consumer',
      placeOfSupply: 'New York'
    };

    const res = await request(app).post('/api/customers').send(payload);
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('Jane Doe');
    expect(res.body.data.gstTreatment).toBe('Consumer');
    expect(res.body.data.gstNumber).toBeNull();
  });
});
