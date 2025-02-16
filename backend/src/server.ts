import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env';
import imageRouter from './routes/image';
import { errorHandler } from './middleware/error';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import { timeoutMiddleware } from './middleware/timeout';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Request timeout
app.use(timeoutMiddleware(30000)); // 30 second timeout

// Body parsing middleware with increased limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', rateLimiterMiddleware);

// Routes
app.use('/api/image', imageRouter);

// Health check endpoint with service status
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      cloudinary: 'ok',
      openai: 'ok'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Only start the server if this file is run directly
if (require.main === module) {
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${config.NODE_ENV} mode`);
  });
}

export default app; 