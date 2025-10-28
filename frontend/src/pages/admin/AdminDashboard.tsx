import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionSetService } from '../../services/questionSetService';
import { QuestionSet } from '../../types';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TOEIC' | 'SCHOOL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = async () => {
    try {
      const data = await questionSetService.getAllAdmin();
      setQuestionSets(data);
    } catch (error) {
      console.error('Failed to load question sets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ câu hỏi này? Tất cả các câu hỏi cũng sẽ bị xóa.')) {
      return;
    }

    try {
      await questionSetService.delete(id);
      setQuestionSets(prev => prev.filter(set => set.id !== id));
    } catch (error) {
      console.error('Failed to delete question set', error);
      alert('Không thể xóa bộ câu hỏi');
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      await questionSetService.update(id, { isPublished: !isPublished });
      setQuestionSets(prev => prev.map(set => 
        set.id === id ? { ...set, isPublished: !isPublished } : set
      ));
    } catch (error) {
      console.error('Failed to update question set', error);
      alert('Không thể cập nhật bộ câu hỏi');
    }
  };

  // Filter question sets based on active tab and search query
  const filteredQuestionSets = questionSets.filter(set => {
    const matchesTab = activeTab === 'ALL' || set.mode === activeTab;
    const matchesSearch = set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (set.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Count by mode
  const toeicCount = questionSets.filter(s => s.mode === 'TOEIC').length;
  const schoolCount = questionSets.filter(s => s.mode === 'SCHOOL').length;

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Quản Trị Hệ Thống</h1>
          <p className="admin-subtitle">Quản lý bộ câu hỏi và câu hỏi</p>
        </div>
        <Link to="/admin/question-set/new" className="btn btn-primary">
          + Tạo bộ câu hỏi mới
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{questionSets.length}</div>
          <div className="stat-label">Tổng số bộ câu hỏi</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {questionSets.filter(s => s.isPublished).length}
          </div>
          <div className="stat-label">Đã công khai</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {questionSets.reduce((sum, set) => sum + (set._count?.questions || 0), 0)}
          </div>
          <div className="stat-label">Tổng số câu hỏi</div>
        </div>
      </div>

      <div className="question-sets-section">
        <div className="section-header">
          <h2 className="section-title">Bộ câu hỏi</h2>
          
          <div className="filter-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                Tất cả ({questionSets.length})
              </button>
              <button
                className={`tab ${activeTab === 'TOEIC' ? 'active' : ''}`}
                onClick={() => setActiveTab('TOEIC')}
              >
                📚 TOEIC ({toeicCount})
              </button>
              <button
                className={`tab ${activeTab === 'SCHOOL' ? 'active' : ''}`}
                onClick={() => setActiveTab('SCHOOL')}
              >
                🎓 Trắc nghiệm ({schoolCount})
              </button>
            </div>
          </div>
        </div>
        
        {filteredQuestionSets.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <p>Không tìm thấy bộ câu hỏi nào với từ khóa "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
                  Xóa tìm kiếm
                </button>
              </>
            ) : (
              <>
                <p>Chưa có bộ câu hỏi nào. Tạo bộ câu hỏi đầu tiên!</p>
                <Link to="/admin/question-set/new" className="btn btn-primary">
                  Tạo bộ câu hỏi
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="question-sets-list">
            {filteredQuestionSets.map((set) => (
              <div key={set.id} className="question-set-card">
                <div className="card-header">
                  <div className="card-title-section">
                    <h3 className="card-title">{set.title}</h3>
                    <div className="card-badges">
                      <span className={`badge ${set.mode === 'TOEIC' ? 'badge-info' : 'badge-purple'}`}>
                        {set.mode === 'TOEIC' ? 'TOEIC' : 'Trắc nghiệm'}
                      </span>
                      <span className={`badge ${set.isPublished ? 'badge-success' : 'badge-warning'}`}>
                        {set.isPublished ? '✓ Đã công khai' : '⏸ Nháp'}
                      </span>
                    </div>
                  </div>
                </div>

                {set.description && (
                  <p className="card-description">{set.description}</p>
                )}

                <div className="card-meta">
                  <span className="meta-item">
                    📝 {set._count?.questions || 0} câu hỏi
                  </span>
                  {set.timeLimit && (
                    <span className="meta-item">
                      ⏱️ {Math.floor(set.timeLimit / 60)} phút
                    </span>
                  )}
                  <span className="meta-item">
                    Tạo ngày {new Date(set.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="card-actions">
                  <Link
                    to={`/admin/question-set/${set.id}/questions`}
                    className="btn btn-sm btn-primary"
                  >
                    📝 Quản lý câu hỏi ({set._count?.questions || 0})
                  </Link>
                  <Link
                    to={`/admin/question-set/${set.id}/edit`}
                    className="btn btn-sm btn-secondary"
                  >
                    ✏️ Sửa
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(set.id, set.isPublished)}
                    className="btn btn-sm btn-secondary"
                  >
                    {set.isPublished ? '⏸ Ẩn' : '✓ Công khai'}
                  </button>
                  <button
                    onClick={() => handleDelete(set.id)}
                    className="btn btn-sm btn-danger"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
