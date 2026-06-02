const { z } = require('zod');

const quoteItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(), // 'custom' or actual UUID
  name: z.string().min(1, { message: "Item name is required" }),
  quantity: z.number().min(0, { message: "Quantity must be positive" }),
  rate: z.number().min(0, { message: "Rate must be positive" }),
  total: z.number()
});

const quotationSchema = z.object({
  quoteNumber: z.string().min(2, { message: "Quote number must be at least 2 characters" }),
  referenceNumber: z.string().optional(),
  clientId: z.string().min(1, { message: "Customer is required" }),
  clientName: z.string().optional(),
  clientCompany: z.string().optional(),
  quoteDate: z.string().min(1, { message: "Quote date is required" }),
  expiryDate: z.string().optional(),
  salesperson: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  subject: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, { message: "At least one item is required" }),
  subtotal: z.number().min(0),
  discountRate: z.number().min(0).max(100, { message: "Discount must be between 0 and 100" }),
  taxType: z.enum(['tds', 'tcs']),
  taxRate: z.number().min(0, { message: "Tax rate must be positive" }),
  taxAmount: z.number().optional(),
  adjustment: z.number(),
  total: z.number(),
  status: z.enum(['draft', 'sent', 'accepted', 'declined', 'invoiced']).optional(),
  customerNotes: z.string().optional(),
  terms: z.string().optional(),
  signatureUrl: z.string().optional()
});

module.exports = {
  quotationSchema
};
