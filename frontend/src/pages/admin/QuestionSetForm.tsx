import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionSetService } from '../../services/questionSetService';
import { QuizMode } from '../../types';
import './QuestionSetForm.css';
// Admin Question Set Form

export default function QuestionSetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mode: 'TOEIC' as QuizMode,
    timeLimit: '',
    isPublished: false,
  });

  useEffect(() => {
    if (id) {
      loadQuestionSet();
    }
  }, [id]);

  const loadQuestionSet = async () => {
    try {
      const data = await questionSetService.getById(id!);
      setFormData({
        title: data.title,
        description: data.description || '',
        mode: data.mode,
        timeLimit: data.timeLimit ? (data.timeLimit / 60).toString() : '',
        isPublished: data.isPublished,
      });
    } catch (error) {
      console.error('Failed to load question set', error);
      setError('Failed to load question set');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        mode: formData.mode,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) * 60 : undefined,
        isPublished: formData.isPublished,
      };

      if (id) {
        await questionSetService.update(id, payload);
        navigate('/admin');
      } else {
        const newSet = await questionSetService.create(payload);
        // Navigate to Question List Page where user can add questions or import JSON
        navigate(`/admin/question-set/${newSet.id}/questions`);
        return;
      }
    } catch (error: any) {
      console.error('Failed to save question set', error);
      setError(error.response?.data?.message || 'Failed to save question set');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">
            {id ? 'Chỉnh Sửa Bộ Câu Hỏi' : 'Tạo Bộ Câu Hỏi Mới'}
          </h1>
          <p className="form-subtitle">
            {id ? 'Cập nhật thông tin bộ câu hỏi' : 'Tạo bài kiểm tra mới cho học sinh'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="question-set-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label required">
              Tiêu đề
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="VD: TOEIC Reading Part 7 - Bộ câu hỏi luyện tập 1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Mô tả nội dung bài kiểm tra này..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mode" className="form-label required">
                Loại bài thi
              </label>
              <select
                id="mode"
                name="mode"
                className="form-select"
                value={formData.mode}
                onChange={handleChange}
                required
              >
                <option value="TOEIC">📚TOEIC Reading</option>
                <option value="SCHOOL">🎓 Luyện trắc nghiệm</option>
              </select>
              <p className="form-help">
                {formData.mode === 'TOEIC' 
                  ? 'Học sinh có thể xem đáp án và giải thích sau khi kiểm tra từng câu'
                  : 'Chế độ thi có giới hạn thời gian - học sinh trả lời từng câu một mà không quay lại'}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="timeLimit" className="form-label">
                Giới hạn thời gian (phút)
              </label>
              <input
                type="number"
                id="timeLimit"
                name="timeLimit"
                className="form-input"
                value={formData.timeLimit}
                onChange={handleChange}
                min="1"
                placeholder="Tùy chọn"
              />
              <p className="form-help">
                Để trống nếu không giới hạn thời gian
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
              />
              <span>Công khai ngay</span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : id ? 'Cập nhật bộ câu hỏi' : 'Tạo & thêm câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
