import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import QuestionSetForm from './pages/admin/QuestionSetForm';
import QuestionListPage from './pages/admin/QuestionListPage';
import QuestionForm from './pages/admin/QuestionForm';
import SubjectManagement from './pages/admin/SubjectManagement';
import QuizConfig from './pages/quiz/QuizConfig';
import ToeicQuiz from './pages/quiz/ToeicQuiz';
import SchoolQuiz from './pages/quiz/SchoolQuiz';
import QuizResults from './pages/quiz/QuizResults';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={user ? <Dashboard /> : <Navigate to="/login" />} />
          
          {/* Admin Routes */}
          {user?.role === 'ADMIN' && (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/subjects" element={<SubjectManagement />} />
              <Route path="/admin/question-set/new" element={<QuestionSetForm />} />
              <Route path="/admin/question-set/:id/edit" element={<QuestionSetForm />} />
              <Route path="/admin/question-set/:id/questions" element={<QuestionListPage />} />
              <Route path="/admin/question-set/:id/questions/new" element={<QuestionForm />} />
              <Route path="/admin/question/:id/edit" element={<QuestionForm />} />
            </>
          )}
          
          {/* Quiz Routes */}
          {user && (
            <>
              <Route path="/quiz/:id/config" element={<QuizConfig />} />
              <Route path="/quiz/:id/toeic" element={<ToeicQuiz />} />
              <Route path="/quiz/:id/school" element={<SchoolQuiz />} />
              <Route path="/quiz/:attemptId/results" element={<QuizResults />} />
            </>
          )}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
