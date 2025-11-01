import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionSetService } from '../../services/questionSetService';
import { subjectService } from '../../services/subjectService';
import { QuizMode, Subject } from '../../types';
import './QuestionSetForm.css';
// Admin Question Set Form

export default function QuestionSetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mode: 'TOEIC' as QuizMode,
    isPublished: false,
    subjectId: '',
  });

  useEffect(() => {
    loadSubjects();
    if (id) {
      loadQuestionSet();
    }
  }, [id]);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to load subjects', error);
    }
  };

  const loadQuestionSet = async () => {
    try {
      const data = await questionSetService.getById(id!);
      setFormData({
        title: data.title,
        description: data.description || '',
        mode: data.mode,
        isPublished: data.isPublished,
        subjectId: data.subjectId || '',
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
        isPublished: formData.isPublished,
        subjectId: formData.subjectId || undefined,
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
                : 'Chế độ thi trắc nghiệm - học sinh có thể cấu hình thời gian khi bắt đầu làm bài'}
            </p>
          </div>

          {formData.mode === 'SCHOOL' && (
            <div className="form-group">
              <label htmlFor="subjectId" className="form-label">
                Môn học
              </label>
              <select
                id="subjectId"
                name="subjectId"
                className="form-select"
                value={formData.subjectId}
                onChange={handleChange}
              >
                <option value="">Chọn môn học (tùy chọn)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <p className="form-help">
                Chọn môn học để dễ dàng phân loại và tìm kiếm
              </p>
            </div>
          )}

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
