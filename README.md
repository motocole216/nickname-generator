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
- Styling: Tailwind CSS (with PostCSS 7 compatibility)

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
   npm install tailwindcss@npm:@tailwindcss/postcss7-compat @tailwindcss/postcss7-compat postcss@^7 autoprefixer@^9
   ```

   Note: The project uses a specific Tailwind CSS configuration for PostCSS 7 compatibility. The PostCSS configuration is already set up in `postcss.config.js`:
   ```javascript
   module.exports = {
     plugins: {
       '@tailwindcss/postcss7-compat': {},
       autoprefixer: {},
     },
   }
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
- [ ] Write unit tests for frontend components
- [ ] Write API endpoint tests
- [ ] Implement integration tests
- [ ] Perform security testing
- [ ] Conduct performance optimization

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