import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionService } from '../../services/questionService';
import { questionSetService } from '../../services/questionSetService';
import { QuestionSet } from '../../types';
import './QuestionForm.css';

export default function QuestionForm() {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 0,
    correctAnswers: [] as number[], // For multiple choice
    explanation: '',
    passageText: '',
    codeBlock: '',
    questionType: 'single' as 'single' | 'multiple',
  });

  useEffect(() => {
    // Check if we're editing an existing question (URL pattern: /admin/question/:id/edit)
    const isEdit = window.location.pathname.includes('/admin/question/');
    setIsEditMode(isEdit);

    if (isEdit) {
      // Extract question ID from URL params
      const questionId = params.id;
      if (questionId) {
        setEditQuestionId(questionId);
        loadQuestion(questionId);
      }
    } else {
      // Creating new question for a question set
      const questionSetId = params.id;
      if (questionSetId) {
        loadQuestionSet(questionSetId);
      }
    }
  }, [params.id]);

  const loadQuestion = async (questionId: string) => {
    try {
      // Get question details by ID
      const question = await questionService.getById(questionId);

      // Load question set info
      const setData = await questionSetService.getById(question.questionSetId);
      setQuestionSet(setData);

      // Populate form
      const isMultiple = Array.isArray(question.correctAnswer);
      setFormData({
        questionText: question.questionText,
        optionA: question.options[0] || '',
        optionB: question.options[1] || '',
        optionC: question.options[2] || '',
        optionD: question.options[3] || '',
        correctAnswer: isMultiple ? 0 : (question.correctAnswer as number),
        correctAnswers: isMultiple ? (question.correctAnswer as number[]) : [],
        explanation: question.explanation || '',
        passageText: question.passageText || '',
        codeBlock: question.codeBlock || '',
        questionType: (question.questionType || 'single') as 'single' | 'multiple',
      });
    } catch (error) {
      console.error('Failed to load question', error);
      setError('Failed to load question');
    }
  };

  const loadQuestionSet = async (questionSetId: string) => {
    try {
      const data = await questionSetService.getById(questionSetId);
      setQuestionSet(data);
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
      const options = [
        formData.optionA,
        formData.optionB,
        formData.optionC,
        formData.optionD,
      ];

      // Determine correct answer based on question type
      const correctAnswer = formData.questionType === 'multiple' 
        ? formData.correctAnswers 
        : formData.correctAnswer;

      // Debug log
      console.log('Submitting question with correctAnswer:', correctAnswer, 'type:', typeof correctAnswer);

      const payload = {
        questionText: formData.questionText,
        options,
        correctAnswer,
        explanation: formData.explanation || undefined,
        passageText: formData.passageText || undefined,
        codeBlock: formData.codeBlock || undefined,
        questionType: formData.questionType,
        questionSetId: questionSet!.id,
      };

      if (isEditMode) {
        // Update existing question
        await questionService.update(editQuestionId!, payload);
        alert('Question updated successfully!');
        navigate(`/admin/question-set/${questionSet!.id}/questions`);
      } else {
        // Create new question
        await questionService.create(payload);

        // Ask if user wants to add another question
        const addAnother = window.confirm('Question saved! Add another question?');
        if (addAnother) {
          setFormData({
            questionText: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: 0,
            correctAnswers: [],
            explanation: '',
            passageText: formData.passageText, // Keep passage for multiple questions
            codeBlock: '',
            questionType: 'single',
          });
        } else {
          navigate(`/admin/question-set/${questionSet!.id}/questions`);
        }
      }
    } catch (error: any) {
      console.error('Failed to save question', error);
      setError(error.response?.data?.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert correctAnswer to number if it's the correctAnswer field
    if (name === 'correctAnswer') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleQuestionTypeChange = (type: 'single' | 'multiple') => {
    setFormData(prev => ({
      ...prev,
      questionType: type,
      correctAnswer: 0,
      correctAnswers: [],
    }));
  };

  const handleMultipleChoiceToggle = (optionIndex: number) => {
    setFormData(prev => {
      const newCorrectAnswers = [...prev.correctAnswers];
      const index = newCorrectAnswers.indexOf(optionIndex);
      
      if (index > -1) {
        newCorrectAnswers.splice(index, 1);
      } else {
        newCorrectAnswers.push(optionIndex);
      }
      
      return { ...prev, correctAnswers: newCorrectAnswers.sort() };
    });
  };

  return (
    <div className="container">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">
            {isEditMode ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
          </h1>
          {questionSet && (
            <div className="question-set-info">
              <span className={`badge ${questionSet.mode === 'TOEIC' ? 'badge-info' : 'badge-purple'}`}>
                {questionSet.mode === 'TOEIC' ? '📚 TOEIC' : '🎓 Trắc nghiệm'}
              </span>
              <span className="set-title">{questionSet.title}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="question-form">
          {/* Question Type Selector - Only for SCHOOL mode */}
          {questionSet?.mode === 'SCHOOL' && (
            <div className="form-group">
              <label className="form-label">Loại câu hỏi</label>
              <div className="question-type-selector">
                <button
                  type="button"
                  className={`type-button ${formData.questionType === 'single' ? 'active' : ''}`}
                  onClick={() => handleQuestionTypeChange('single')}
                >
                  <span className="type-icon">⭕</span>
                  <div>
                    <strong>Chọn một đáp án</strong>
                    <small>Chỉ có một đáp án đúng</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={`type-button ${formData.questionType === 'multiple' ? 'active' : ''}`}
                  onClick={() => handleQuestionTypeChange('multiple')}
                >
                  <span className="type-icon">☑️</span>
                  <div>
                    <strong>Chọn nhiều đáp án</strong>
                    <small>Có thể có nhiều đáp án đúng</small>
                  </div>
                </button>
              </div>
            </div>
          )}

          {questionSet?.mode === 'TOEIC' && (
            <div className="form-group">
              <label htmlFor="passageText" className="form-label">
                Đoạn văn (Tùy chọn)
              </label>
              <textarea
                id="passageText"
                name="passageText"
                className="form-textarea"
                value={formData.passageText}
                onChange={handleChange}
                rows={8}
                placeholder="Nhập đoạn văn đọc hiểu nếu câu hỏi này yêu cầu..."
              />
              <p className="form-help">
                Đối với câu hỏi đọc TOEIC, bạn có thể cung cấp một đoạn văn áp dụng cho nhiều câu hỏi
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="questionText" className="form-label required">
              Câu hỏi
            </label>
            <textarea
              id="questionText"
              name="questionText"
              className="form-textarea"
              value={formData.questionText}
              onChange={handleChange}
              rows={3}
              required
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {/* Code Block - Only for SCHOOL mode */}
          {questionSet?.mode === 'SCHOOL' && (
            <div className="form-group">
              <label htmlFor="codeBlock" className="form-label">
                Code Block
              </label>
              <textarea
                id="codeBlock"
                name="codeBlock"
                className="form-textarea code-input"
                value={formData.codeBlock}
                onChange={handleChange}
                rows={8}
                placeholder="Nhập code ở đây..."
                spellCheck={false}
              />
            </div>
          )}

          <div className="options-section">
            <h3 className="section-title">Các lựa chọn</h3>
            
            <div className="form-group">
              <label htmlFor="optionA" className="form-label required">
                Đáp án A
              </label>
              <input
                type="text"
                id="optionA"
                name="optionA"
                className="form-input"
                value={formData.optionA}
                onChange={handleChange}
                required
                placeholder="Nhập đáp án A..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="optionB" className="form-label required">
                Đáp án B
              </label>
              <input
                type="text"
                id="optionB"
                name="optionB"
                className="form-input"
                value={formData.optionB}
                onChange={handleChange}
                required
                placeholder="Nhập đáp án B..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="optionC" className="form-label required">
                Đáp án C
              </label>
              <input
                type="text"
                id="optionC"
                name="optionC"
                className="form-input"
                value={formData.optionC}
                onChange={handleChange}
                required
                placeholder="Nhập đáp án C..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="optionD" className="form-label required">
                Đáp án D
              </label>
              <input
                type="text"
                id="optionD"
                name="optionD"
                className="form-input"
                value={formData.optionD}
                onChange={handleChange}
                required
                placeholder="Nhập đáp án D..."
              />
            </div>
          </div>

          {/* Correct Answer Selection */}
          {formData.questionType === 'single' ? (
            <div className="form-group">
              <label htmlFor="correctAnswer" className="form-label required">
                Đáp án đúng
              </label>
              <select
                id="correctAnswer"
                name="correctAnswer"
                className="form-select"
                value={formData.correctAnswer}
                onChange={handleChange}
                required
              >
                <option value={0}>A - {formData.optionA || '(Đáp án A)'}</option>
                <option value={1}>B - {formData.optionB || '(Đáp án B)'}</option>
                <option value={2}>C - {formData.optionC || '(Đáp án C)'}</option>
                <option value={3}>D - {formData.optionD || '(Đáp án D)'}</option>
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label required">
                Đáp án đúng (Chọn nhiều)
              </label>
              <div className="multiple-choice-selector">
                {[
                  { index: 0, label: 'A', value: formData.optionA },
                  { index: 1, label: 'B', value: formData.optionB },
                  { index: 2, label: 'C', value: formData.optionC },
                  { index: 3, label: 'D', value: formData.optionD },
                ].map(option => (
                  <label key={option.index} className="multiple-choice-option">
                    <input
                      type="checkbox"
                      checked={formData.correctAnswers.includes(option.index)}
                      onChange={() => handleMultipleChoiceToggle(option.index)}
                    />
                    <span className="checkbox-label">
                      <strong>{option.label}</strong> - {option.value || `(Đáp án ${option.label})`}
                    </span>
                  </label>
                ))}
              </div>
              <p className="form-help">
                ✓ Chọn tất cả các đáp án đúng (phải có ít nhất 1 đáp án)
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="explanation" className="form-label">
              Giải thích
            </label>
            <textarea
              id="explanation"
              name="explanation"
              className="form-textarea"
              value={formData.explanation}
              onChange={handleChange}
              rows={4}
              placeholder="Giải thích tại sao đây là đáp án đúng..."
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => questionSet ? navigate(`/admin/question-set/${questionSet.id}/questions`) : navigate('/admin')}
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
              {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
