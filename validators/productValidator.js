const { z } = require('zod');

// Schema matching the frontend requirements for Product
const productSchema = z.object({
  name: z.string({ required_error: "Item name is required" }).min(2, { message: "Item name must be at least 2 characters" }),
  type: z.enum(['goods', 'service']),
  unit: z.string({ required_error: "Unit is required" }).min(1, { message: "Unit is required" }),
  hsnCode: z.string().optional(),
  taxPreference: z.string({ required_error: "Tax Preference is required" }).min(1, { message: "Tax Preference is required" }),
  intraStateTaxRate: z.string().optional(),
  interStateTaxRate: z.string().optional(),
  sellingPrice: z.number().nonnegative({ message: "Price must be a positive number" }).or(
    z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Price must be a positive number"
    })
  ),
  description: z.string().optional(),
  imageUrl: z.string().optional()
});

module.exports = {
  productSchema
};
