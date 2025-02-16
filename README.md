# AI Nickname Generator 📸 ✨

A fun web application that generates creative and humorous nicknames based on uploaded photos using AI technology.

## Features

- Photo upload functionality
- AI-powered nickname generation using GPT-4
- Generation of personalized, funny nicknames
- Instant results display
- User-friendly interface with modern design
- Results caching for improved performance
- Automatic retry mechanism for failed requests
- Real-time loading and error states

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js/Express with TypeScript
- AI Integration: OpenAI GPT-4 API
- Image Storage: Cloudinary
- Styling: Tailwind CSS (with PostCSS 7 compatibility)
- Caching: node-cache (backend), in-memory Map (frontend)

## Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn
- OpenAI API key (with access to GPT-4 models)
- Cloudinary account

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/motocole216/nickname-generator.git
   cd nickname-generator
   ```

2. Set up the backend:
   ```bash
   cd backend
   cp .env.example .env  # Create .env file and fill in your API keys
   npm install
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   cp .env.example .env  # Create .env file and update if needed
   npm install
   npm install tailwindcss@npm:@tailwindcss/postcss7-compat @tailwindcss/postcss7-compat postcss@^7 autoprefixer@^9
   ```

4. Configure your environment variables:

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3002

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3002`

## Recent Updates

### Version 1.1.0
- Updated OpenAI integration to use GPT-4 Turbo for nickname generation
- Improved error handling and logging for AI service calls
- Enhanced retry mechanism for failed API requests
- Updated environment configuration to use `.env` files consistently
- Fixed CORS configuration for local development

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 3001)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

### Frontend (.env)
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:3001/api)

## Development

- Backend development server: `npm run dev` in the backend directory
- Frontend development server: `npm start` in the frontend directory
- Build frontend: `npm run build`
- Build backend: `npm run build`

## Project Structure

```
.
├── backend/                 # Backend server
│   ├── src/                # Source files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Custom middleware (retry, etc.)
│   │   ├── services/       # Business logic and services
│   │   ├── routes/         # API routes
│   │   └── server.ts       # Server entry point
│   └── package.json        # Backend dependencies
│
└── frontend/               # Frontend application
    ├── src/               # Source files
    │   ├── components/    # React components
    │   ├── api/          # API client
    │   ├── utils/        # Utility functions (cache, retry)
    │   ├── pages/        # Page components
    │   └── App.tsx       # Main application
    └── package.json      # Frontend dependencies
```

## Security Note

The OpenAI API key is currently stored directly in the code for development purposes. In a production environment, this should be moved to environment variables or a secure key management system.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Project Roadmap 🗺️

### 1. Project Setup & Configuration
- [x] Initialize React frontend project
- [x] Set up Node.js/Express backend
- [x] Configure environment variables
- [x] Set up project structure
- [x] Install necessary dependencies

### 2. Frontend Foundation
- [x] Create basic UI layout
- [x] Implement responsive design
- [x] Set up routing system
- [x] Create image upload component
- [x] Design results display component
- [x] Implement loading states and error handling

### 3. Backend Infrastructure
- [x] Set up Express server
- [x] Create API endpoints structure
- [x] Implement error handling middleware
- [x] Set up input validation
- [x] Configure CORS and security measures

### 4. Image Processing
- [x] Set up Cloudinary integration
- [x] Implement image upload functionality
- [x] Add image validation and optimization
- [x] Create image storage management
- [x] Implement image deletion/cleanup

### 5. AI Integration
- [x] Configure OpenAI API connection
- [x] Implement image analysis functionality
- [x] Create nickname generation logic
- [x] Add AI response error handling
- [x] Implement rate limiting

### 6. Feature Integration
- [x] Connect frontend with backend APIs
- [x] Implement end-to-end image upload flow
- [x] Add nickname generation and display
- [x] Implement results caching
- [x] Add retry mechanisms

### 7. Testing & Validation
- [x] Write unit tests for frontend components
- [x] Write API endpoint tests
- [x] Implement integration tests
- [x] Perform security testing
- [x] Conduct performance optimization

### 8. Deployment & Documentation
- [x] Set up CI/CD pipeline
- [x] Configure production environment
- [x] Write API documentation
- [x] Create user guide
- [x] Add deployment instructions

Each task should be completed and validated before moving to the next one. This ensures:
- Manageable development process
- Early bug detection
- Stable feature implementation
- Clear progress tracking
- Easier collaboration

## Backend Infrastructure Details

The backend is built with Express and TypeScript, featuring:

- **Error Handling**: Custom error classes and middleware for consistent error responses
- **Input Validation**: Request validation using express-validator
- **Security Measures**:
  - Helmet for secure HTTP headers
  - CORS configuration with origin control
  - Rate limiting (100 requests per 15 minutes)
  - Request size limits (10MB)
  - Body parsing security

### Error Types
- `AppError`: Base error class for application-specific errors
- `ValidationError`: For request validation failures

### Middleware
- Error handling middleware for consistent error responses
- Validation middleware using express-validator
- Security middleware (helmet, cors, rate-limiting)
- Body parsing middleware with size limits

## Image Processing Features

The application includes robust image processing capabilities:

### Upload & Validation
- Base64 image validation
- File size limit (5MB)
- Supported formats: JPEG, PNG, WebP
- Automatic format optimization
- Dimension constraints (max 2048px)

### Storage Management
- Cloudinary integration for reliable cloud storage
- Automatic image optimization
- Secure URL generation
- Public ID management

### Cleanup & Maintenance
- Automatic cleanup of unused images (24-hour retention)
- Manual image deletion capability
- Batch cleanup operations
- Error handling and recovery

### Testing Coverage
- Comprehensive unit tests for all image operations
- Integration tests for API endpoints
- Mock implementations for OpenAI and Cloudinary
- Rate limiter testing
- Test setup and teardown utilities
- Custom Jest matchers for response validation

### Rate Limiting
- Custom rate limiter implementation
- IP-based request tracking
- Configurable time windows (default: 15 minutes)
- Adjustable request limits (default: 10 requests per window)
- Automatic counter reset
- Memory-efficient using Map data structure

### Recent Updates
- Added comprehensive test suite for image controllers
- Implemented custom rate limiter with cleanup
- Added integration tests for API endpoints
- Improved mock implementations for external services
- Enhanced error handling in tests
- Added test utilities and custom matchers
- Implemented proper test cleanup and teardown

## Caching System

The application implements a two-layer caching system for improved performance:

### Frontend Cache
- In-memory Map-based cache
- 24-hour TTL for nickname results
- Automatic cache invalidation
- Cache hit indicator in UI

### Backend Cache
- node-cache implementation
- Configurable TTL and check periods
- Memory-efficient storage
- Automatic cleanup of expired items

## Retry Mechanism

The application includes a robust retry system for handling transient failures:

### Frontend Retry
- Exponential backoff strategy
- Configurable max attempts (default: 3)
- Selective retry based on error types
- User-friendly retry UI

### Backend Retry
- Middleware-based retry mechanism
- Configurable retry parameters
- Error type filtering
- Automatic request replay

## Testing Infrastructure

The project includes comprehensive testing for both frontend and backend:

### Frontend Tests
- Component unit tests using React Testing Library
- Tests for all major components:
  - NicknameGenerator
  - ResultsDisplay
  - ImageUpload
  - Layout
- Coverage for:
  - Rendering
  - User interactions
  - Loading states
  - Error handling
  - Router integration

### Backend Tests
- Integration tests for all API endpoints
- Image processing validation
- Error handling scenarios
- Rate limiting verification
- Security measures testing
- Health check monitoring

### Test Tools & Libraries
- Jest for test running and assertions
- React Testing Library for component testing
- Supertest for API endpoint testing
- Mock implementations for:
  - Cloudinary
  - OpenAI
  - File uploads
  - API responses
