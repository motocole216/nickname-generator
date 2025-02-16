# AI Nickname Generator 📸 ✨

A fun web application that generates creative and humorous nicknames based on uploaded photos using AI technology.

## Features

- Photo upload functionality
- AI-powered image analysis using GPT-4 Vision
- Generation of personalized, funny nicknames
- Instant results display
- User-friendly interface with modern design

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js/Express with TypeScript
- AI Integration: OpenAI GPT-4 Vision API
- Image Storage: Cloudinary
- Styling: Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn
- OpenAI API key (GPT-4 Vision access required)
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

   Update the OpenAI API key in `src/controllers/image.ts`:
   ```typescript
   const openai = new OpenAI({
     apiKey: 'your-api-key-here'
   });
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   cp .env.example .env  # Create .env file and update if needed
   npm install
   ```

4. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

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
│   │   ├── routes/        # API routes
│   │   └── server.ts      # Server entry point
│   └── package.json       # Backend dependencies
│
└── frontend/              # Frontend application
    ├── src/              # Source files
    │   ├── components/   # React components
    │   ├── api/          # API client
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
- [ ] Initialize React frontend project
- [ ] Set up Node.js/Express backend
- [ ] Configure environment variables
- [ ] Set up project structure
- [ ] Install necessary dependencies

### 2. Frontend Foundation
- [ ] Create basic UI layout
- [ ] Implement responsive design
- [ ] Set up routing system
- [ ] Create image upload component
- [ ] Design results display component
- [ ] Implement loading states and error handling

### 3. Backend Infrastructure
- [ ] Set up Express server
- [ ] Create API endpoints structure
- [ ] Implement error handling middleware
- [ ] Set up input validation
- [ ] Configure CORS and security measures

### 4. Image Processing
- [ ] Set up Cloudinary integration
- [ ] Implement image upload functionality
- [ ] Add image validation and optimization
- [ ] Create image storage management
- [ ] Implement image deletion/cleanup

### 5. AI Integration
- [ ] Configure OpenAI API connection
- [ ] Implement image analysis functionality
- [ ] Create nickname generation logic
- [ ] Add AI response error handling
- [ ] Implement rate limiting

### 6. Feature Integration
- [ ] Connect frontend with backend APIs
- [ ] Implement end-to-end image upload flow
- [ ] Add nickname generation and display
- [ ] Implement results caching
- [ ] Add retry mechanisms

### 7. Testing & Validation
- [ ] Write unit tests for frontend components
- [ ] Write API endpoint tests
- [ ] Implement integration tests
- [ ] Perform security testing
- [ ] Conduct performance optimization

### 8. Deployment & Documentation
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Add deployment instructions

Each task should be completed and validated before moving to the next one. This ensures:
- Manageable development process
- Early bug detection
- Stable feature implementation
- Clear progress tracking
- Easier collaboration

