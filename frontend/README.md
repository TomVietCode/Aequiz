# Quiz Application Frontend

## Overview
React + TypeScript frontend for the Dual-Mode Interactive Quiz Application with TOEIC Reading Practice and School Test Practice modes.

## Tech Stack
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Routing:** React Router DOM v6
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Styling:** CSS Modules (vanilla CSS)
- **Icons:** React Icons

## Project Structure
```
frontend/
├── public/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── Layout.tsx    # Main layout with header/nav
│   ├── pages/            # Page components
│   │   ├── auth/        # Login & Register
│   │   ├── admin/       # Admin dashboard & forms
│   │   ├── quiz/        # Quiz pages (Config, TOEIC, School, Results)
│   │   └── Dashboard.tsx
│   ├── services/         # API service layer
│   │   ├── api.ts       # Axios configuration
│   │   ├── authService.ts
│   │   ├── questionSetService.ts
│   │   ├── questionService.ts
│   │   └── attemptService.ts
│   ├── store/           # Zustand state stores
│   │   ├── authStore.ts
│   │   └── quizStore.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx          # Root component with routes
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm run dev
```

The application will start on `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

## Key Features

### 1. Authentication
- Login and registration pages
- JWT token-based authentication
- Persistent sessions (localStorage)
- Role-based access (Admin/Student)

### 2. Student Dashboard
- View all available quiz sets
- Separate sections for TOEIC and School quizzes
- Progress tracking with completion indicators
- Score history display

### 3. Quiz Configuration
Before starting a quiz, students can configure:
- **Practice Mode:** Retry only incorrect questions
- **Timed Mode:** Set custom time limit
- **Auto-Advance:** Automatically move to next question after answering

### 4. TOEIC Reading Quiz Interface
- **Split-screen layout:** Reading passage on left, questions on right
- **No vertical scrolling:** Entire interface fits in viewport
- **Navigation:** Back and Next buttons to navigate between questions
- **Timer:** Prominent timer display
- **Instant Feedback:** Immediate right/wrong indication
- **Detailed Explanations:** Show explanation after each answer

### 5. School Test Quiz Interface
- **Minimalist design:** Single question display
- **No Back Navigation:** Cannot return to previous questions
- **Radio-style options:** Clean vertical list of choices
- **Instant Feedback:** Immediate right/wrong indication
- **Auto-Advance:** Optional automatic progression

### 6. Results Page
- **Score Display:** Large percentage score with visual circle
- **Statistics:** Correct answers, time taken
- **Answer Review:** List of all questions with status
- **Actions:** Return to dashboard or retry quiz

### 7. Admin Features (Planned)
- Create and edit question sets
- Add questions manually
- Import questions from JSON files
- Publish/unpublish question sets

## Component Descriptions

### Layout Component
Main application layout with:
- Header with logo and navigation
- User menu with profile and logout
- Responsive design

### Auth Pages
- `Login.tsx`: User login form
- `Register.tsx`: New user registration form

### Dashboard
- Displays all available quiz sets
- Shows progress for completed quizzes
- Separate sections for TOEIC and School modes

### Quiz Pages
- `QuizConfig.tsx`: Pre-quiz configuration modal
- `ToeicQuiz.tsx`: Split-screen TOEIC interface
- `SchoolQuiz.tsx`: Minimalist school quiz interface
- `QuizResults.tsx`: Results summary and review

## State Management

### Auth Store (Zustand)
Manages authentication state:
- Current user
- JWT token
- Login/logout functions
- User profile loading

### Quiz Store (Zustand)
Manages quiz state:
- Current attempt
- Questions list
- Current question index
- User answers
- Timer state

## API Integration

All API calls are made through service modules in `src/services/`:

```typescript
// Example: Starting a quiz
import { attemptService } from './services/attemptService';

const attempt = await attemptService.create(questionSetId, config);
```

### Service Modules
- **authService:** Authentication endpoints
- **questionSetService:** Quiz set management
- **questionService:** Question CRUD operations
- **attemptService:** Quiz attempts and answers

## Styling

The application uses vanilla CSS with CSS variables for theming:

```css
:root {
  --primary-color: #2563eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  --text-primary: #1f2937;
  --bg-primary: #ffffff;
  /* ... */
}
```

## UI/UX Design Principles

### No Vertical Scrolling in Quiz
- All quiz interfaces fit within viewport height
- Questions and options visible without scrolling
- Navigation buttons positioned ergonomically

### TOEIC Mode
- High-fidelity simulation of official TOEIC interface
- Split-screen layout for passages and questions
- Prominent timer always visible
- Back/Next navigation available

### School Mode
- Minimalist, distraction-free design
- One question at a time
- No back navigation (simulates real test conditions)
- Clean radio-button options

### Responsive Design
- Mobile-friendly layouts
- Touch-optimized buttons
- Flexible grid systems

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox

## Future Enhancements
- Offline mode with service workers
- Real-time progress sync
- Advanced analytics dashboard
- Social features (leaderboards, sharing)
- Mobile native apps (React Native)

## Contributing
1. Follow TypeScript best practices
- Use proper types, avoid `any`
2. Maintain component modularity
3. Keep CSS organized and scoped
4. Write clean, commented code
5. Test on multiple browsers

## License
MIT
