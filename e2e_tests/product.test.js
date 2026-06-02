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

  it('should update an existing product', async () => {
    // Create a product first
    const prod = await prisma.product.create({
      data: {
        userId,
        name: 'Server Rack v1',
        type: 'GOODS',
        unit: 'Unit',
        taxPreference: 'TAXABLE',
        sellingPrice: 8000,
        intraStateTaxRate: 'GST18 [18%]',
        interStateTaxRate: 'IGST18 [18%]'
      }
    });

    const updatePayload = {
      name: 'Server Rack v2',
      type: 'goods',
      unit: 'Rack',
      taxPreference: 'Taxable',
      sellingPrice: 9500,
      intraStateTaxRate: 'GST12 [12%]',
      interStateTaxRate: 'IGST12 [12%]',
      description: 'Upgraded heavy duty server rack'
    };

    const res = await request(app)
      .put(`/api/products/${prod.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toEqual('Server Rack v2');
    expect(res.body.data.unit).toEqual('Rack');
    expect(res.body.data.sellingPrice).toEqual(9500);
    expect(res.body.data.description).toEqual('Upgraded heavy duty server rack');
    expect(res.body.data.intraStateTaxRate).toEqual('GST12 [12%]');
  });

  it('should fail to update with validation errors', async () => {
    const prod = await prisma.product.create({
      data: {
        userId,
        name: 'Temp Product',
        type: 'GOODS',
        unit: 'Unit',
        taxPreference: 'TAXABLE',
        sellingPrice: 100
      }
    });

    const updatePayload = {
      name: 'Temp Product',
      type: 'goods',
      unit: '', // empty unit is invalid
      taxPreference: 'Taxable',
      sellingPrice: -50 // negative price is invalid
    };

    const res = await request(app)
      .put(`/api/products/${prod.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 404 when updating non-existent product', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const updatePayload = {
      name: 'Non Existent Server',
      type: 'goods',
      unit: 'Server',
      taxPreference: 'Taxable',
      sellingPrice: 20000
    };

    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.statusCode).toEqual(404);
  });

  it('should delete an existing product', async () => {
    // Create a product first
    const prod = await prisma.product.create({
      data: {
        userId,
        name: 'Product to Delete',
        type: 'GOODS',
        unit: 'Unit',
        taxPreference: 'TAXABLE',
        sellingPrice: 1000
      }
    });

    // Delete the product
    const deleteRes = await request(app)
      .delete(`/api/products/${prod.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toEqual(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify it is gone
    const fetchRes = await request(app)
      .get(`/api/products/${prod.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fetchRes.statusCode).toEqual(404);
  });
});
