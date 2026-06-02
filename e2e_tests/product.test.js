const request = require('supertest');
const app = require('../server');
const prisma = require('../models/index');
const jwt = require('jsonwebtoken');

let token;
let userId;

describe('Product API E2E Tests', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);

    const testEmail = 'product.e2e@test.com';
    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: testEmail,
          password: 'password123', 
          accountType: 'BUSINESS',
          fullName: 'Product E2E Tester',
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
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });

    // Clean up
    await prisma.product.deleteMany({
      where: { userId: userId }
    });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({
      where: { userId: userId }
    });
    await prisma.$disconnect();
  });

  it('should create a valid goods product', async () => {
    const payload = {
      name: 'Premium Cloud Server',
      type: 'goods',
      unit: 'Server',
      hsnCode: '851762',
      taxPreference: 'Taxable',
      intraStateTaxRate: 'GST18 [18%]',
      interStateTaxRate: 'IGST18 [18%]',
      sellingPrice: 15000,
      description: 'High-performance cloud server'
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toEqual('Premium Cloud Server');
    expect(res.body.data.type).toEqual('GOODS');
    expect(res.body.data.taxPreference).toEqual('TAXABLE');
  });

  it('should create a valid service product with Non-Taxable preference', async () => {
    const payload = {
      name: 'Consulting Service',
      type: 'service',
      unit: 'Hours',
      taxPreference: 'Non-Taxable',
      sellingPrice: 5000,
      description: 'Business consulting hours'
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toEqual('Consulting Service');
    expect(res.body.data.type).toEqual('SERVICE');
    expect(res.body.data.taxPreference).toEqual('NON_TAXABLE');
  });

  it('should fail if sellingPrice is negative', async () => {
    const payload = {
      name: 'Faulty Product',
      type: 'goods',
      unit: 'Box',
      taxPreference: 'Taxable',
      sellingPrice: -100
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'sellingPrice',
          message: 'Price must be a positive number'
        })
      ])
    );
  });

  it('should fail if unit is missing', async () => {
    const payload = {
      name: 'No Unit Product',
      type: 'goods',
      taxPreference: 'Taxable',
      sellingPrice: 100
      // missing unit
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'unit',
          message: 'Invalid input: expected string, received undefined'
        })
      ])
    );
  });
});
