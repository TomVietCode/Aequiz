import { useState } from 'react';
import { questionSetService } from '../services/questionSetService';
import './ImportJsonModal.css';

interface ImportJsonModalProps {
  questionSetId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportJsonModal({ questionSetId, onClose, onSuccess }: ImportJsonModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setError('');
    setLoading(true);

    try {
      // Parse JSON
      const questions = JSON.parse(jsonText);

      // Validate format
      if (!Array.isArray(questions)) {
        throw new Error('JSON phải là một mảng các câu hỏi');
      }

      // Validate each question
      questions.forEach((q, index) => {
        if (!q.questionText) throw new Error(`Câu hỏi ${index + 1}: Thiếu questionText`);
        if (!Array.isArray(q.options)) throw new Error(`Câu hỏi ${index + 1}: options phải là một mảng`);
        if (q.options.length < 2) throw new Error(`Câu hỏi ${index + 1}: Phải có ít nhất 2 lựa chọn`);
        
        // Support both single (number) and multiple (array) correct answers
        if (typeof q.correctAnswer !== 'number' && !Array.isArray(q.correctAnswer)) {
          throw new Error(`Câu hỏi ${index + 1}: correctAnswer phải là số hoặc mảng số`);
        }
        
        // Validate correctAnswer values
        const answers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        answers.forEach((ans: number) => {
          if (typeof ans !== 'number' || ans < 0 || ans >= q.options.length) {
            throw new Error(`Câu hỏi ${index + 1}: correctAnswer phải từ 0 đến ${q.options.length - 1}`);
          }
        });
      });

      // Convert to File object (backend expects file upload)
      const blob = new Blob([jsonText], { type: 'application/json' });
      const file = new File([blob], 'questions.json', { type: 'application/json' });

      // Import via API
      await questionSetService.importQuestions(questionSetId, file);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Không thể import câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = `[
  {
    "questionText": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is the capital and largest city of France.",
    "passageText": "Optional reading passage for TOEIC"
  },
  {
    "questionText": "Which are object-oriented languages?",
    "options": ["Python", "C", "Java", "Assembly"],
    "correctAnswer": [0, 2],
    "questionType": "multiple",
    "explanation": "Python and Java support OOP.",
    "codeBlock": "class Example:\\n    def __init__(self):\\n        pass"
  }
]`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import câu hỏi từ JSON</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="help-section">
            <h4>Mẫu định dạng JSON:</h4>
            <pre className="code-block">{exampleJson}</pre>
            <p className="help-text">
              <strong>Các trường:</strong>
            </p>
            <ul className="help-list">
              <li><code>questionText</code> (bắt buộc): Nội dung câu hỏi</li>
              <li><code>options</code> (bắt buộc): Mảng các lựa chọn</li>
              <li><code>correctAnswer</code> (bắt buộc): Số (một đáp án) hoặc mảng số (nhiều đáp án)</li>
              <li><code>questionType</code> (tùy chọn): <code>"single"</code> hoặc <code>"multiple"</code></li>
              <li><code>explanation</code> (tùy chọn): Giải thích cho đáp án</li>
              <li><code>passageText</code> (tùy chọn): Đoạn văn đọc hiểu (TOEIC)</li>
              <li><code>codeBlock</code> (tùy chọn): Đoạn code cho câu hỏi lập trình</li>
            </ul>
            <div className="help-note">
              💡 <strong>Ví dụ:</strong> <code>"correctAnswer": 2</code> (một đáp án) 
              hoặc <code>"correctAnswer": [0, 2]</code> (nhiều đáp án)
            </div>
          </div>

          <div className="json-input-section">
            <label htmlFor="jsonInput">Dán JSON của bạn vào đây:</label>
            <textarea
              id="jsonInput"
              className="json-textarea"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Dán mảng JSON vào đây..."
              rows={15}
            />
          </div>

          {error && (
            <div className="error-message">
              <strong>Lỗi:</strong> {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleImport}
            disabled={loading || !jsonText.trim()}
          >
            {loading ? 'Đang import...' : 'Import câu hỏi'}
          </button>
        </div>
      </div>
    </div>
  );
}
