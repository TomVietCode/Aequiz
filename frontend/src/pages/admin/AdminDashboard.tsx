import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionSetService } from '../../services/questionSetService';
import { subjectService } from '../../services/subjectService';
import { QuestionSet, Subject } from '../../types';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TOEIC' | 'SCHOOL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  useEffect(() => {
    loadQuestionSets();
    loadSubjects();
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

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to load subjects', error);
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

  // Filter question sets based on active tab, search query, and subject
  const filteredQuestionSets = questionSets.filter(set => {
    const matchesTab = activeTab === 'ALL' || set.mode === activeTab;
    const matchesSearch = set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (set.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = !selectedSubject || set.subjectId === selectedSubject;
    return matchesTab && matchesSearch && matchesSubject;
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
        <div className="admin-header-actions">
          <Link to="/admin/subjects" className="btn btn-secondary">
            📚 Quản lý Môn học
          </Link>
          <Link to="/admin/question-set/new" className="btn btn-primary">
            + Tạo bộ câu hỏi mới
          </Link>
        </div>
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
                onClick={() => {
                  setActiveTab('ALL');
                  setSelectedSubject('');
                }}
              >
                Tất cả ({questionSets.length})
              </button>
              <button
                className={`tab ${activeTab === 'TOEIC' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('TOEIC');
                  setSelectedSubject('');
                }}
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
        
        {/* Subject filter - only show when SCHOOL tab is active */}
        {activeTab === 'SCHOOL' && subjects.length > 0 && (
          <div className="filter-controls" style={{ marginTop: '1rem' }}>
            <select
              id="subjectFilter"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="search-input"
              style={{ maxWidth: '300px' }}
            >
              <option value="">Tất cả môn học</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({questionSets.filter(s => s.mode === 'SCHOOL' && s.subjectId === subject.id).length})
                </option>
              ))}
            </select>
          </div>
        )}
        
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
                  {set.subject && (
                    <span 
                      className="meta-item subject-tag"
                      style={{ 
                        backgroundColor: set.subject.color || '#3B82F6',
                        color: '#fff'
                      }}
                    >
                      {set.subject.name}
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
                    className="btn btn-sm btn-secondary"
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
