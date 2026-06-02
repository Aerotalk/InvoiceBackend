const request = require('supertest');
const app = require('../server');
const prisma = require('../models/index');

const jwt = require('jsonwebtoken');

let token;
let testUser;
let testClient;

beforeAll(async () => {
  // Setup Test User
  testUser = await prisma.user.create({
    data: {
      fullName: 'Quote Test User',
      email: `quote_${Date.now()}@test.com`,
      password: 'password123',
      accountType: 'BUSINESS',
      phoneCode: '91',
      phoneNumber: '9999999999',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai'
    }
  });

  // Manually sign token to bypass login bcrypt checks
  token = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

  const clientRes = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({
      clientType: 'business',
      company: 'Test Quote Corp',
      displayName: 'Test Quote Corp',
      email: 'testquote@corp.com',
      workPhone: '9999999999',
      primaryContactFirstName: 'John',
      primaryContactLastName: 'Doe',
      currency: 'USD',
      language: 'English',
      gstTreatment: 'Unregistered Business',
      placeOfSupply: 'Maharashtra',
      billingAddress: {
        street1: '123 Test St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      }
    });

  if (clientRes.statusCode !== 201) {
    console.error('Client creation failed:', clientRes.body);
  }
  
  testClient = clientRes.body.data;
});

afterAll(async () => {
  if (testUser) {
    await prisma.quotation.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  }
  if (testClient) {
    await prisma.customer.deleteMany({ where: { id: testClient.id } });
  }
});

describe('Quotation API E2E Tests', () => {
  let createdQuoteId;

  it('should create a valid quotation in draft status', async () => {
    const payload = {
      quoteNumber: `QT-${Date.now()}`,
      referenceNumber: 'REF-001',
      clientId: testClient.id,
      clientName: testClient.displayName,
      clientCompany: testClient.companyName,
      quoteDate: new Date().toISOString(),
      subject: 'Software Dev Services',
      items: [
        {
          productId: 'custom',
          name: 'Consulting Hour',
          quantity: 10,
          rate: 150,
          total: 1500
        }
      ],
      subtotal: 1500,
      discountRate: 10,
      taxType: 'tds',
      taxRate: 18,
      taxAmount: 270, // Simplified tax calculation for test payload
      adjustment: 0,
      total: 1620,
      status: 'draft',
      customerNotes: 'Thanks for business',
      terms: 'Net 30'
    };

    const res = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.quoteNumber).toEqual(payload.quoteNumber);
    expect(res.body.data.status).toEqual('draft');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].productNameSnapshot).toEqual('Consulting Hour');

    createdQuoteId = res.body.data.id;
  });

  it('should fail if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        quoteNumber: `QT-${Date.now()}`
        // Missing clientId, quoteDate, items, etc.
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'clientId' }),
        expect.objectContaining({ field: 'items' })
      ])
    );
  });

  it('should retrieve the created quotation', async () => {
    const res = await request(app)
      .get(`/api/quotations/${createdQuoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.id).toEqual(createdQuoteId);
    expect(res.body.data.clientCompanySnapshot).toEqual('Test Quote Corp');
  });
});
