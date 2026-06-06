const express = require('express');
console.log("\n\n!!! 🚀 SERVER.JS STARTING - INVOICE IQ BACKEND 🚀 !!!\n\n");

// 1. REGISTER GLOBAL ERROR HANDLERS FIRST
process.on('uncaughtException', (err) => {
    console.error('❌ CRITICAL: Uncaught Exception:', err);
    try {
        if (global.logger) global.logger.error('❌ CRITICAL: Uncaught Exception:', err);
    } catch (e) { }
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    try {
        if (global.logger) global.logger.error('❌ CRITICAL: Unhandled Rejection:', reason);
    } catch (e) { }
});

const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Make logger globally available for the exception handlers
global.logger = logger;

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Dynamic CORS Configuration
const allowedOrigins = [
    'http://localhost:5173', // Local Vite Frontend
    'http://localhost:5000',
    'https://invoicefrontend-black.vercel.app' // Local Backend
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin);
        const isVercel = origin.includes('.vercel.app');

        if (isAllowed || isVercel) {
            return callback(null, true);
        } else {
            if (global.logger) global.logger.warn(`⚠️ CORS Blocked Origin: ${origin}`);
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
    },
    credentials: true
}));

app.use(helmet({
    crossOriginResourcePolicy: false,
}));

// Stream morgan logs to winston
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// Health // Default Route
app.get('/', (req, res) => {
    res.send('InvoiceIQ API is running...');
});

// Health Status Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: '🟢 UP',
        message: '🚀 InvoiceIQ Backend is up and running smoothly! ✨',
        timestamp: new Date().toISOString()
    });
});

// Wrap Route Includes in Try-Catch to debug startup crashes
try {
    app.use('/api/auth', require('./routes/authRoutes'));
    logger.debug('🔐 Auth routes registered');
} catch (error) {
    logger.error('❌ Failed to load Auth Routes:', error);
}

try {
    app.use('/api/invoices', require('./routes/invoiceRoutes'));
    logger.debug('📄 Invoice routes registered');
} catch (error) {
    logger.error('❌ Failed to load Invoice Routes:', error);
}

try {
    app.use('/api/clients', require('./routes/customerRoutes'));
    logger.debug('🏢 Customer/Client routes registered');
} catch (error) {
    logger.error('❌ Failed to load Customer Routes:', error);
}

try {
    app.use('/api/vendors', require('./routes/vendorRoutes'));
    logger.debug('🏭 Vendor routes registered');
} catch (error) {
    logger.error('❌ Failed to load Vendor Routes:', error);
}

try {
    app.use('/api/payments', require('./routes/paymentRoutes'));
    logger.debug('💳 Payment routes registered');
} catch (error) {
    logger.error('❌ Failed to load Payment Routes:', error);
}

try {
    app.use('/api/products', require('./routes/productRoutes'));
    logger.debug('📦 Product routes registered');
} catch (error) {
    logger.error('❌ Failed to load Product Routes:', error);
}

try {
    app.use('/api/projects', require('./routes/projectRoutes'));
    logger.debug('🏗️ Project routes registered');
} catch (error) {
    logger.error('❌ Failed to load Project Routes:', error);
}

try {
    app.use('/api/quotations', require('./routes/quotationRoutes'));
    logger.debug('📄 Quotation routes registered');
} catch (error) {
    logger.error('❌ Failed to load Quotation Routes:', error);
}

try {
    app.use('/api/challans', require('./routes/challanRoutes'));
    logger.debug('🚚 Delivery Challan routes registered');
} catch (error) {
    logger.error('❌ Failed to load Delivery Challan Routes:', error);
}

try {
    app.use('/api/expenses', require('./routes/expenseRoutes'));
    logger.debug('💸 Expense routes registered');
} catch (error) {
    logger.error('❌ Failed to load Expense Routes:', error);
}

try {
    app.use('/api/purchase-orders', require('./routes/purchaseOrderRoutes'));
    logger.debug('🛒 Purchase Order routes registered');
} catch (error) {
    logger.error('❌ Failed to load Purchase Order Routes:', error);
}

try {
    app.use('/api/settings', require('./routes/settingsRoutes'));
    logger.debug('⚙️ Settings routes registered');
} catch (error) {
    logger.error('❌ Failed to load Settings Routes:', error);
}

// 6. Setup static file serving for uploads and API Route for file uploading
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
try {
    app.use('/api/upload', require('./routes/uploadRoutes'));
    logger.debug('📤 Upload routes registered');
} catch (error) {
    logger.error('❌ Failed to load Upload Routes:', error);
}

try {
    app.use('/api/export', require('./routes/exportRoutes'));
    logger.debug('📊 Export routes registered');
} catch (error) {
    logger.error('❌ Failed to load Export Routes:', error);
}

try {
    app.use('/api/dashboard', require('./routes/dashboardRoutes'));
    logger.debug('📈 Dashboard routes registered');
} catch (error) {
    logger.error('❌ Failed to load Dashboard Routes:', error);
}

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

logger.info('⏳ Attempting to start server...');

if (require.main === module || process.env.NODE_ENV === 'production') {
    try {
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Server running on port ${PORT} (0.0.0.0)`);
        });

        server.on('error', (err) => {
            logger.error('❌ Server failed to start:', err);
            process.exit(1);
        });
    } catch (err) {
        logger.error('❌ Synchronous error during app.listen:', err);
        process.exit(1);
    }
} else {
    logger.warn('⚠️ Server not started: require.main !== module');
}

module.exports = app;
