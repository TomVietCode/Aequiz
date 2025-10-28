import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if current route is a quiz page
  const isQuizPage = location.pathname.includes('/quiz/') && 
                     (location.pathname.includes('/toeic') || location.pathname.includes('/school'));

  return (
    <div className="layout">
      {!isQuizPage && (
        <header className="header">
          <div className="container">
            <div className="header-content">
              <Link to="/" className="logo">
                AEQUIZ
              </Link>
              <nav className="nav">
                {user && (
                  <>
                    <Link to="/" className="nav-link">
                      Trang chủ
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link to="/admin" className="nav-link">
                        Quản trị
                      </Link>
                    )}
                    <div className="user-menu">
                      <span className="user-name">{user.name}</span>
                      <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>
      )}
      <main className={isQuizPage ? 'main-content-quiz' : 'main-content'}>
        <Outlet />
      </main>
    </div>
  );
}
