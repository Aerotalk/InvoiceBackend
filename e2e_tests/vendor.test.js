const request = require('supertest');
const app = require('../server');
const prisma = require('../models/index');
const jwt = require('jsonwebtoken');

let token;
let userId;

describe('Vendor API E2E Tests', () => {
  beforeAll(async () => {
    jest.setTimeout(30000); // 30s timeout for remote DB

    // Ensure test user exists
    const testEmail = 'vendor.e2e@test.com';
    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: testEmail,
          password: 'password123', // Doesn't matter for this test
          accountType: 'BUSINESS',
          fullName: 'Vendor E2E Tester',
          companyName: 'Test Inc.',
          phoneCode: '+1',
          phoneNumber: '1234567890',
          country: 'US',
          state: 'NY',
          city: 'New York'
        }
      });
    }
    
    userId = user.id;
    // Generate valid token for the test user
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

    // Clean up any existing test vendors created by this user
    await prisma.vendor.deleteMany({
      where: { userId: userId }
    });
  });

  afterAll(async () => {
    await prisma.vendor.deleteMany({
      where: { userId: userId }
    });
    await prisma.$disconnect();
  });

  it('should create a valid business vendor', async () => {
    const payload = {
      vendorType: 'business',
      displayName: 'Acme Test Corp',
      company: 'Acme Test Corp',
      email: 'billing@acmetest.com',
      currency: 'USD',
      language: 'English',
      gstTreatment: 'Registered Business - Regular',
      gstNumber: '22AAAAA0000A1Z5',
      contactPersons: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@acmetest.com',
          phone: '+1 555-0198'
        }
      ]
    };

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toEqual('Acme Test Corp');
    expect(res.body.data.gstNumber).toEqual('22AAAAA0000A1Z5');
  });

  it('should fail if business vendor is missing company name', async () => {
    const payload = {
      vendorType: 'business',
      displayName: 'Missing Company Corp',
      // company missing
      email: 'billing@missing.com',
      currency: 'USD',
      language: 'English',
      gstTreatment: 'Overseas',
    };

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'company',
          message: 'Company name is required for business vendors'
        })
      ])
    );
  });

  it('should fail if registered business is missing gstNumber', async () => {
    const payload = {
      vendorType: 'business',
      displayName: 'No GST Corp',
      company: 'No GST Corp',
      email: 'nogst@test.com',
      currency: 'INR',
      language: 'English',
      gstTreatment: 'Registered Business - Regular',
      // gstNumber missing
    };

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'gstNumber',
          message: 'GST Number is required for registered businesses'
        })
      ])
    );
  });

  it('should create an individual vendor without gstNumber if Consumer', async () => {
    const payload = {
      vendorType: 'individual',
      displayName: 'Jane Doe',
      company: 'Individual Vendor',
      email: 'jane@doe.com',
      currency: 'INR',
      language: 'English',
      gstTreatment: 'Consumer',
      // No gstNumber required
    };

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toEqual('Jane Doe');
    expect(res.body.data.vendorType).toEqual('INDIVIDUAL');
  });
});
