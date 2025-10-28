# Dual-Mode Interactive Quiz Web Application

A full-stack web application for taking multiple-choice quizzes with two distinct modes: **TOEIC Reading Practice** and **School/University Test Practice**. Built with modern technologies and designed for an optimal user experience with no vertical scrolling during quizzes.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Design Specifications](#design-specifications)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🎓 Student Features
- **Dual Quiz Modes:**
  - TOEIC Reading Practice with split-screen interface
  - School Test Practice with minimalist single-question view
- **Progress Tracking:** Dashboard shows completion status and scores
- **Flexible Quiz Configuration:**
  - Practice Mode: Retry only incorrect questions
  - Timed Mode: Set custom time limits
  - Auto-Advance: Automatically move to next question
- **Instant Feedback:** Immediate right/wrong indication after each answer
- **Detailed Explanations:** Comprehensive explanations for TOEIC questions
- **Results Analysis:** Review performance with detailed statistics

### 👨‍💼 Admin Features
- **Question Set Management:** Create and organize quiz collections
- **Manual Question Entry:** Add questions through intuitive forms
- **Bulk Import:** Upload questions via JSON files
- **Publishing Control:** Publish/unpublish quiz sets
- **Progress Monitoring:** Track student performance (planned)

### 🎨 UX/UI Highlights
- **No Vertical Scrolling:** Entire quiz interface fits in viewport
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Ergonomic Navigation:** Easy-to-reach buttons and controls
- **Accessibility:** Keyboard navigation and screen reader support
- **Modern Aesthetics:** Clean, professional interface

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** SQLite
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Validation:** Express Validator

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Routing:** React Router DOM v6
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Styling:** CSS (Vanilla with CSS Variables)
- **Icons:** React Icons

## 📁 Project Structure

```
exam-practice/
├── backend/                 # Backend API
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── server.ts       # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
(No need for a separate database server - SQLite is file-based!)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd exam-practice
```

### 2. Setup Backend

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run prisma:migrate
npm run prisma:generate

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env if needed (API URL)

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- API Health Check: http://localhost:5000/api/health

## ⚙️ Configuration

### Backend Environment Variables
```env
DATABASE_URL="file:./dev.db"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:5000/api
```

## 📖 Usage

### For Students

1. **Register/Login:** Create an account or login
2. **Browse Quizzes:** View available TOEIC and School quizzes on the dashboard
3. **Configure Quiz:** Click on a quiz and configure settings:
   - Enable practice mode to retry incorrect questions
   - Set a time limit if desired
   - Enable auto-advance for automatic progression
4. **Take Quiz:**
   - **TOEIC Mode:** Read passage on left, answer questions on right
   - **School Mode:** Answer questions one at a time, no going back
5. **Review Results:** See your score, review answers, and retry

### For Admins

1. **Login as Admin:** Use admin credentials
2. **Create Question Set:** Navigate to Admin Dashboard
3. **Add Questions:**
   - **Manually:** Fill out the question form
   - **Bulk Import:** Upload a JSON file with questions
4. **Publish:** Make the quiz available to students

### JSON Import Format

```json
[
  {
    "questionText": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is the capital and most populous city of France.",
    "passageText": "Optional reading passage for TOEIC questions"
  }
]
```

**Field Descriptions:**
- `questionText` (required): The question
- `options` (required): Array of 4 choice options
- `correctAnswer` (required): Index of correct option (0-3)
- `explanation` (optional): Detailed explanation
- `passageText` (optional): Reading passage for TOEIC

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (authenticated)

### Question Sets
- `GET /api/question-sets` - Get all published sets
- `GET /api/question-sets/:id` - Get set by ID
- `POST /api/question-sets` - Create set (admin)
- `PUT /api/question-sets/:id` - Update set (admin)
- `DELETE /api/question-sets/:id` - Delete set (admin)
- `POST /api/question-sets/:id/import` - Import questions (admin)

### Questions
- `GET /api/questions/set/:questionSetId` - Get all questions for a set
- `POST /api/questions` - Create question (admin)
- `PUT /api/questions/:id` - Update question (admin)
- `DELETE /api/questions/:id` - Delete question (admin)

### Attempts
- `POST /api/attempts` - Start new quiz attempt
- `GET /api/attempts/:id` - Get attempt details
- `GET /api/attempts/user/:userId` - Get user's attempts
- `POST /api/attempts/:id/answer` - Submit answer
- `POST /api/attempts/:id/complete` - Complete quiz

## 🎨 Design Specifications

### TOEIC Reading Test Interface
- **Layout:** Split-screen (passage left, questions right)
- **Scrolling:** No vertical scrolling required
- **Navigation:** Back/Next buttons always visible
- **Timer:** Prominent display at top
- **Feedback:** Instant with detailed explanations

### School Test Interface
- **Layout:** Single question centered
- **Scrolling:** No vertical scrolling required
- **Navigation:** Forward-only (no back button)
- **Design:** Minimalist, inspired by provided image
- **Feedback:** Instant right/wrong indication

### Viewport Constraints
- All quiz interfaces fit within standard viewport (1920x1080, 1366x768, etc.)
- Responsive breakpoints for tablets and mobile
- Ergonomic button placement for easy access

## 🧪 Development

### Running Tests (Planned)
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Management
```bash
# Open Prisma Studio
cd backend
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Reset database
npx prisma migrate reset
```

### Code Quality
- **TypeScript:** Strict mode enabled
- **ESLint:** Configured for both backend and frontend
- **Prettier:** Code formatting (planned)

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
MIT

## 🙏 Acknowledgments
- TOEIC test format inspiration
- Educational quiz best practices
- Open source community

## 📞 Support
For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API documentation

---

**Built with ❤️ for effective learning and practice**
