import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionSetService } from '../../services/questionSetService';
import { questionService } from '../../services/questionService';
import { QuestionSet, Question } from '../../types';
import ImportJsonModal from '../../components/ImportJsonModal';
import './QuestionListPage.css';

export default function QuestionListPage() {
  const { id } = useParams();
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const setData = await questionSetService.getById(id!);
      setQuestionSet(setData);
      setQuestions(setData.questions || []);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      return;
    }

    try {
      await questionService.delete(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (error) {
      console.error('Failed to delete question', error);
      alert('Không thể xóa câu hỏi');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const importedQuestions = await questionSetService.importQuestions(id!, file);
      alert(`Đã import thành công ${importedQuestions.length} câu hỏi!`);
      
      // Reload data from server to get all questions with parsed JSON
      await loadData();
    } catch (error: any) {
      console.error('Failed to import questions', error);
      alert(error.response?.data?.message || 'Không thể import câu hỏi. Vui lòng kiểm tra định dạng JSON.');
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!questionSet) {
    return (
      <div className="container">
        <div className="error-message">Không tìm thấy bộ câu hỏi</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/admin">Quản trị</Link>
          <span>/</span>
          <span>{questionSet.title}</span>
        </div>

        <div className="header-content">
          <div>
            <h1 className="page-title">Quản Lý Câu Hỏi</h1>
            <div className="header-meta">
              <span className={`badge ${questionSet.mode === 'TOEIC' ? 'badge-info' : 'badge-purple'}`}>
                {questionSet.mode === 'TOEIC' ? '📚 TOEIC' : '🎓 Trắc nghiệm'}
              </span>
              <span className="meta-text">{questionSet.title}</span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowJsonModal(true)}
            >
              📝 Dán JSON
            </button>
            <label className="btn btn-secondary">
              {importing ? 'Đang import...' : '📁 Import file JSON'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                style={{ display: 'none' }}
              />
            </label>
            <Link
              to={`/admin/question-set/${id}/questions/new`}
              className="btn btn-primary"
            >
              + Thêm câu hỏi
            </Link>
          </div>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Chưa có câu hỏi nào</h3>
          <p>Bắt đầu bằng cách thêm câu hỏi thủ công hoặc import từ file JSON</p>
          <div className="empty-actions">
            <Link
              to={`/admin/question-set/${id}/questions/new`}
              className="btn btn-primary"
            >
              Thêm câu hỏi đầu tiên
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => setShowJsonModal(true)}
            >
              📝 Dán JSON
            </button>
            <label className="btn btn-secondary">
              Import từ file JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="questions-list">
          <div className="list-header">
            <h2>Câu hỏi ({questions.length})</h2>
          </div>

          {questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-number">#{index + 1}</div>
              
              <div className="question-content">
                {question.passageText && (
                  <div className="question-passage">
                    <strong>Đoạn văn:</strong> {question.passageText.substring(0, 100)}...
                  </div>
                )}
                
                <div className="question-text">
                  <strong>Câu hỏi: </strong> {question.questionText}
                </div>

                <div className="question-options">
                  {question.options.map((option, optIndex) => {
                    // Handle both single (number) and multiple (array) correct answers
                    const correctAnswers = Array.isArray(question.correctAnswer) 
                      ? question.correctAnswer 
                      : [question.correctAnswer];
                    const isCorrect = correctAnswers.includes(optIndex);
                    
                    return (
                      <div
                        key={optIndex}
                        className={`option ${isCorrect ? 'correct' : ''}`}
                      >
                        <span className="option-letter"></span>
                        <span>{option}</span>
                        {isCorrect && <span className="correct-badge">✓ Đúng</span>}
                      </div>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="question-explanation">
                    <strong>Giải thích:</strong> {question.explanation}
                  </div>
                )}
              </div>

              <div className="question-actions">
                <Link
                  to={`/admin/question/${question.id}/edit`}
                  className="btn btn-sm btn-secondary"
                >
                  ✏️ Sửa
                </Link>
                <button
                  onClick={() => handleDelete(question.id)}
                  className="btn btn-sm btn-secondary"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="page-footer">
        <Link to="/admin" className="btn btn-secondary">
          ← Về trang quản trị
        </Link>
        {questions.length > 0 && (
          <Link
            to={`/admin/question-set/${id}/questions/new`}
            className="btn btn-primary"
          >
            + Thêm câu hỏi khác
          </Link>
        )}
      </div>

      {showJsonModal && (
        <ImportJsonModal
          questionSetId={id!}
          mode={questionSet.mode}
          onClose={() => setShowJsonModal(false)}
          onSuccess={() => {
            setShowJsonModal(false);
            loadData(); // Reload questions after successful import
          }}
        />
      )}
    </div>
  );
}
