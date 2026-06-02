const request = require('supertest');
const app = require('../server');
const prisma = require('../models/index');
const jwt = require('jsonwebtoken');

let token;
let testUser;
let testClient;
let createdChallanId;

beforeAll(async () => {
  // Setup Test User
  testUser = await prisma.user.create({
    data: {
      fullName: 'Challan Test User',
      email: `challan_${Date.now()}@test.com`,
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
      company: 'Test Challan Corp',
      displayName: 'Test Challan Corp',
      email: 'testchallan@corp.com',
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
    await prisma.deliveryChallan.deleteMany({ where: { userId: testUser.id } });
  }
  if (testClient) {
    await prisma.customer.deleteMany({ where: { id: testClient.id } });
  }
  if (testUser) {
    await prisma.user.delete({ where: { id: testUser.id } });
  }
});

describe('Delivery Challan API E2E Tests', () => {
  it('should create a valid challan in issued status', async () => {
    const payload = {
      challanNumber: `DC-${Date.now()}`,
      referenceNumber: 'REF-DC001',
      clientId: testClient.id,
      clientName: testClient.displayName,
      clientCompany: testClient.companyName,
      challanDate: new Date().toISOString(),
      challanType: 'Supply for Job Work',
      items: [
        {
          productId: 'custom',
          name: 'Custom Machine Part',
          quantity: 2,
          rate: 500,
          total: 1000
        }
      ],
      subtotal: 1000,
      discountRate: 10,
      discountAmount: 100,
      adjustment: 50,
      total: 950,
      status: 'issued',
      customerNotes: 'Deliver carefully',
      terms: 'Non-returnable'
    };

    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.challanType).toEqual('Supply for Job Work');
    expect(res.body.data.status).toEqual('issued');
    
    createdChallanId = res.body.data.id;
  });

  it('should fail if required fields are missing', async () => {
    const payload = {
      challanNumber: `DC-${Date.now()}`
      // missing clientId, date, etc.
    };

    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toEqual('Validation Error');
  });

  it('should retrieve the created challan', async () => {
    const res = await request(app)
      .get(`/api/challans/${createdChallanId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.id).toEqual(createdChallanId);
    expect(res.body.data.clientCompanySnapshot).toEqual('Test Challan Corp');
  });
});
