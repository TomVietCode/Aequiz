import { useState, useEffect } from 'react';
import { subjectService, Subject, SubjectCreateInput } from '../../services/subjectService';
import './SubjectManagement.css';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectCreateInput>({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to load subjects', error);
      alert('Không thể tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên môn học');
      return;
    }

    try {
      if (editingSubject) {
        await subjectService.update(editingSubject.id, formData);
        alert('Cập nhật môn học thành công');
      } else {
        await subjectService.create(formData);
        alert('Tạo môn học thành công');
      }
      
      setShowForm(false);
      setEditingSubject(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      loadSubjects();
    } catch (error: any) {
      console.error('Failed to save subject', error);
      alert(error.response?.data?.message || 'Không thể lưu môn học');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      color: subject.color || '#3B82F6',
    });
    setShowForm(true);
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`Xóa môn học "${subject.name}"? Bạn không thể xóa môn học đã có bài tập.`)) {
      return;
    }

    try {
      await subjectService.delete(subject.id);
      alert('Xóa môn học thành công');
      loadSubjects();
    } catch (error: any) {
      console.error('Failed to delete subject', error);
      alert(error.response?.data?.message || 'Không thể xóa môn học');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSubject(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="subject-header">
        <h2>Quản lý Môn học</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Thêm môn học
        </button>
      </div>

      {showForm && (
        <div className="subject-form-modal">
          <div className="subject-form-container card">
            <h3>{editingSubject ? 'Sửa môn học' : 'Thêm môn học mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Tên môn học *</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Toán học, Vật lý..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về môn học..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">Màu sắc</label>
                <div className="color-picker-container">
                  <input
                    type="color"
                    id="color"
                    className="color-picker"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-control color-text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                  <div 
                    className="color-preview" 
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubject ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div key={subject.id} className="subject-card card">
            <div className="subject-card-header">
              <div 
                className="subject-color-indicator" 
                style={{ backgroundColor: subject.color || '#3B82F6' }}
              />
              <h3 className="subject-card-title">{subject.name}</h3>
            </div>
            
            {subject.description && (
              <p className="subject-card-description">{subject.description}</p>
            )}
            
            <div className="subject-card-meta">
              <span className="meta-badge">
                {subject._count?.questionSets || 0} bài tập
              </span>
            </div>

            <div className="subject-card-actions">
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => handleEdit(subject)}
              >
                Sửa
              </button>
              <button 
                className="btn btn-sm btn-danger" 
                onClick={() => handleDelete(subject)}
                disabled={subject._count && subject._count.questionSets > 0}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="no-subjects">
            <p>Chưa có môn học nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
