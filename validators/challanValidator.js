const { z } = require('zod');

const challanItemSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(0),
  rate: z.number().min(0),
  tax: z.string().optional().nullable(),
  taxAmount: z.number().optional().nullable(),
  amount: z.number().optional().nullable(),
  total: z.number().optional().nullable()
});

const challanSchema = z.object({
  challanNumber: z.string().min(2, 'Challan number must be at least 2 characters'),
  referenceNumber: z.string().optional().nullable(),
  clientId: z.string().uuid('Customer is required'),
  clientName: z.string().optional().nullable(),
  clientCompany: z.string().optional().nullable(),
  challanDate: z.string().or(z.date()),
  challanType: z.string().min(1, 'Challan type is required'),
  items: z.array(challanItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number(),
  discountRate: z.number().optional().nullable(),
  discountAmount: z.number().optional().nullable(),
  adjustment: z.number().optional().nullable(),
  total: z.number(),
  status: z.enum(['draft', 'issued']).default('draft'),
  customerNotes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable()
});

const validateChallan = (req, res, next) => {
  try {
    req.body = challanSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: (error.errors || error.issues).map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = {
  validateChallan
};
