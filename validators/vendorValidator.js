const { z } = require('zod');

// Schema matching the frontend requirements for Vendor
const vendorSchema = z.object({
  vendorType: z.enum(['individual', 'business']),
  name: z.string().optional(),
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
  salutation: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email({ message: "Invalid email format" }),
  phone: z.string().optional(),
  workPhoneCode: z.string().optional(),
  workPhone: z.string().optional(),
  mobileCode: z.string().optional(),
  mobile: z.string().optional(),
  currency: z.string().min(1, { message: "Currency is required" }),
  language: z.string().min(1, { message: "Language is required" }),
  
  avatar: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  remarks: z.string().optional(),

  // Other Details
  gstTreatment: z.string().min(1, { message: "GST Treatment is required" }),
  gstNumber: z.string().optional(),
  pan: z.string().optional(),
  paymentTerms: z.string().optional(),
  enablePortal: z.boolean().optional(),
  website: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),

  // Address (Billing)
  billingAddress: z.object({
    attention: z.string().optional(),
    street1: z.string().optional(),
    street2: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional()
  }).optional(),

  // Address (Shipping)
  shippingAddress: z.object({
    attention: z.string().optional(),
    street1: z.string().optional(),
    street2: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional()
  }).optional(),

  // Relationships
  contactPersons: z.array(z.object({
    salutation: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().optional()
  })).optional(),

  customFields: z.array(z.object({
    label: z.string().optional(),
    key: z.string().optional(),
    value: z.string()
  })).optional(),
  
  documentsCount: z.number().optional()
}).superRefine((data, ctx) => {
  // If registered business, gstNumber is required
  const isNotRegisteredBusiness = ['Overseas', 'Consumer', 'Unregistered Business', ''].includes(data.gstTreatment);
  if (!isNotRegisteredBusiness && !data.gstNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "GST Number is required for registered businesses",
      path: ['gstNumber']
    });
  }

  // If business, company name is required
  if (data.vendorType === 'business' && (!data.company || data.company === "Individual Vendor")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Company name is required for business vendors",
      path: ['company']
    });
  }
});

module.exports = {
  vendorSchema
};
