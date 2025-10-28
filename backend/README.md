# Quiz Application Backend

## Overview
Backend API for the Dual-Mode Interactive Quiz Web Application supporting TOEIC Reading Practice and School/University Test Practice.

## Tech Stack
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript
- **Database:** SQLite with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer

## Project Structure
```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── database.ts        # Prisma client configuration
│   ├── controllers/           # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── questionSet.controller.ts
│   │   ├── question.controller.ts
│   │   └── attempt.controller.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts           # Authentication & authorization
│   │   └── errorHandler.ts   # Global error handling
│   ├── routes/               # API routes
│   │   ├── auth.routes.ts
│   │   ├── questionSet.routes.ts
│   │   ├── question.routes.ts
│   │   └── attempt.routes.ts
│   └── server.ts             # Application entry point
├── uploads/                  # Temporary file uploads
├── .env                      # Environment variables
├── package.json
└── tsconfig.json
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="file:./dev.db"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database
SQLite doesn't require a separate database server. Just run:
```bash
npm run prisma:migrate
npm run prisma:generate
```

This will create a `dev.db` file in the backend directory.

### 4. Run the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (authenticated)

### Question Sets
- `GET /api/question-sets` - Get all published question sets
- `GET /api/question-sets/:id` - Get question set by ID
- `POST /api/question-sets` - Create question set (admin only)
- `PUT /api/question-sets/:id` - Update question set (admin only)
- `DELETE /api/question-sets/:id` - Delete question set (admin only)
- `POST /api/question-sets/:id/import` - Import questions from JSON file (admin only)

### Questions
- `GET /api/questions/set/:questionSetId` - Get all questions for a set
- `POST /api/questions` - Create question (admin only)
- `PUT /api/questions/:id` - Update question (admin only)
- `DELETE /api/questions/:id` - Delete question (admin only)

### Attempts
- `POST /api/attempts` - Start new quiz attempt
- `GET /api/attempts/:id` - Get attempt details
- `GET /api/attempts/user/:userId` - Get user's attempts
- `POST /api/attempts/:id/answer` - Submit answer for question
- `POST /api/attempts/:id/complete` - Complete quiz attempt

## JSON Import Format

To import questions in bulk, use the following JSON structure:

```json
[
  {
    "questionText": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is the capital of France.",
    "passageText": "Optional reading passage for TOEIC questions"
  }
]
```

**Fields:**
- `questionText` (string, required): The question text
- `options` (array of strings, required): Multiple choice options
- `correctAnswer` (number, required): Index of correct option (0-3)
- `explanation` (string, optional): Detailed explanation for the answer
- `passageText` (string, optional): Reading passage for TOEIC questions

See `sample-questions.json` for a complete example.

## Database Schema

### Key Models
- **User**: Stores user accounts (admin/student roles)
- **QuestionSet**: Quiz collections (TOEIC/SCHOOL modes)
- **Question**: Individual questions with options and explanations
- **Attempt**: User quiz attempts with configuration
- **UserAnswer**: Individual answers within attempts

## Development Tools

### Prisma Studio
View and edit database records with a GUI:
```bash
npm run prisma:studio
```

### Database Migrations
After modifying `schema.prisma`:
```bash
npm run prisma:migrate
```

## Error Handling
The API uses consistent error responses:
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin/Student)
- CORS protection
- Input validation

## License
MIT
