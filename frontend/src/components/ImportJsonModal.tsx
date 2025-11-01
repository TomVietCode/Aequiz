import { useState } from 'react';
import { questionSetService } from '../services/questionSetService';
import { QuizMode } from '../types';
import './ImportJsonModal.css';

interface ImportJsonModalProps {
  questionSetId: string;
  mode: QuizMode;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportJsonModal({ questionSetId, mode, onClose, onSuccess }: ImportJsonModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Different example JSON based on quiz mode
  const toeicExampleJson = `[
  {
    "questionText": "What is the main topic of the passage?",
    "options": [
      "Company expansion plans",
      "New product launch",
      "Employee benefits",
      "Office relocation"
    ],
    "correctAnswer": 0,
    "explanation": "The passage discusses the company's plans to expand into new markets.",
    "passageText": "ABC Corporation announced today that it will expand its operations to three new countries in Asia. The expansion is part of the company's five-year growth strategy..."
  },
  {
    "questionText": "According to the passage, when will the expansion begin?",
    "options": [
      "Next month",
      "Next quarter",
      "Next year",
      "In two years"
    ],
    "correctAnswer": 1,
    "explanation": "The passage mentions the expansion will start in the next quarter.",
    "passageText": "ABC Corporation announced today that it will expand its operations to three new countries in Asia. The expansion is part of the company's five-year growth strategy..."
  }
]`;

  const schoolExampleJson = `[
  {
    "questionText": "Phương trình nào sau đây có nghiệm x = 2?",
    "options": [
      "x + 1 = 3",
      "2x = 6",
      "x - 1 = 3",
      "x/2 = 4"
    ],
    "correctAnswer": 0,
    "questionType": "single",
    "explanation": "Thay x = 2 vào phương trình: 2 + 1 = 3 (đúng)\\n\\n**Giải thích chi tiết:**\\nPhương trình có dạng: x + 1 = 3\\nKhi thay x = 2, ta được: 2 + 1 = 3 $\\rightarrow$ **Đúng**"
  },
  {
    "questionText": "Các nguyên tố nào sau đây là kim loại?",
    "options": [
      "Sắt (Fe)",
      "Oxy (O)",
      "Đồng (Cu)",
      "Lưu huỳnh (S)"
    ],
    "correctAnswer": [0, 2],
    "questionType": "multiple",
    "explanation": "**Đáp án đúng:** Sắt (Fe) và Đồng (Cu)\\n\\n**Giải thích:**\\n- Sắt (Fe): Kim loại chuyển tiếp\\n- Đồng (Cu): Kim loại chuyển tiếp\\n- Oxy (O): Phi kim\\n- Lưu huỳnh (S): Phi kim"
  },
  {
    "questionText": "Đoạn code sau in ra kết quả gì?",
    "options": [
      "0 1 2",
      "1 2 3",
      "0 1 2 3",
      "1 2"
    ],
    "correctAnswer": 0,
    "questionType": "single",
    "explanation": "**Kết quả:** 0 1 2\\n\\nHàm **range(3)** tạo ra dãy số từ 0 đến 2 (không bao gồm 3).\\nVòng lặp sẽ in ra từng giá trị: 0, 1, 2",
    "codeBlock": "for i in range(3):\\n    print(i)"
  }
]`;

  const exampleJson = mode === 'TOEIC' ? toeicExampleJson : schoolExampleJson;

  // Full guide text to copy
  const getFullGuideText = () => {
    const modeTitle = mode === 'TOEIC' ? '📚 TOEIC Reading' : '🎓 Trắc nghiệm';
    
    const fieldsDescription = mode === 'TOEIC' 
      ? `- questionText (bắt buộc): Nội dung câu hỏi
- options (bắt buộc): Mảng các lựa chọn (ít nhất 2 lựa chọn)
- correctAnswer (bắt buộc): Số (một đáp án đúng) hoặc mảng số (nhiều đáp án đúng)
- explanation (tùy chọn): Giải thích chi tiết cho đáp án
- passageText (khuyến nghị): Đoạn văn đọc hiểu cho câu hỏi TOEIC`
      : `- questionText (bắt buộc): Nội dung câu hỏi
- options (bắt buộc): Mảng các lựa chọn (ít nhất 2 lựa chọn)
- correctAnswer (bắt buộc): Số (một đáp án đúng) hoặc mảng số (nhiều đáp án đúng)
- questionType (tùy chọn): "single" (mặc định) hoặc "multiple"
- explanation (tùy chọn): Giải thích chi tiết cho đáp án
- codeBlock (tùy chọn): Đoạn code cho câu hỏi lập trình`;

    const noteText = mode === 'TOEIC'
      ? 'Với TOEIC, Nhiều câu hỏi có thể dùng chung một passageText.'
      : '"correctAnswer": 0 (một đáp án) hoặc "correctAnswer": [0, 2] (nhiều đáp án đúng)';

    return `=== MẪU ĐỊNH DẠNG JSON CHO ${modeTitle.toUpperCase()} ===

${exampleJson}

=== CÁC TRƯỜNG DỮ LIỆU ===
${fieldsDescription}

💡 LƯU Ý: ${noteText}

=== FORMAT VĂN BẢN TRONG EXPLANATION ===
- **text** → text in đậm
- \\n hoặc \\\\n → Xuống dòng
- $\\rightarrow$ → Mũi tên →
- $\\leftarrow$ → Mũi tên ←
- $\\Rightarrow$ → Mũi tên ⇒

Ví dụ: "explanation": "**Giải thích:**\\\\nBước 1: Tính toán\\\\nBước 2: Kết luận $\\rightarrow$ Đáp án A"
`;
  };

  const handleCopyExample = async () => {
    try {
      const fullGuide = getFullGuideText();
      await navigator.clipboard.writeText(fullGuide);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import câu hỏi từ JSON</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="help-section">
            <div className="help-section-header">
              <h4>Mẫu định dạng JSON:</h4>
              <button 
                className="btn-copy-example" 
                onClick={handleCopyExample}
                title="Copy toàn bộ hướng dẫn (JSON + Chú thích + Format)"
              >
                {copied ? '✓ Đã copy' : '📋 Copy'}
              </button>
            </div>
            <pre className="code-block">{exampleJson}</pre>
            <p className="help-text">
              <strong>Các trường:</strong>
            </p>
            <ul className="help-list">
              <li><code>questionText</code> (bắt buộc): Nội dung câu hỏi</li>
              <li><code>options</code> (bắt buộc): Mảng các lựa chọn (ít nhất 2 lựa chọn)</li>
              <li><code>correctAnswer</code> (bắt buộc): {mode === 'TOEIC' ? 'Số (một đáp án đúng)' : 'Số (một đáp án đúng) hoặc mảng số (nhiều đáp án đúng)'}</li>
              {mode === 'SCHOOL' && (
                <li><code>questionType</code> (tùy chọn): <code>"single"</code> (mặc định) hoặc <code>"multiple"</code></li>
              )}
              <li><code>explanation</code> (tùy chọn): Giải thích chi tiết cho đáp án</li>
              {mode === 'TOEIC' && (
                <li><code>passageText</code> (khuyến nghị): Đoạn văn đọc hiểu cho câu hỏi TOEIC</li>
              )}
              {mode === 'SCHOOL' && (
                <li><code>codeBlock</code> (tùy chọn): Đoạn code cho câu hỏi lập trình</li>
              )}
            </ul>
            <div className="help-note">
              💡 <strong>Lưu ý:</strong>
              {mode === 'TOEIC' ? (
                <> Với TOEIC, nên thêm <code>passageText</code> để có đoạn văn đọc hiểu. 
                Nhiều câu hỏi có thể dùng chung một <code>passageText</code>.</>
              ) : (
                <> <code>"correctAnswer": 0</code> (một đáp án) 
                hoặc <code>"correctAnswer": [0, 2]</code> (nhiều đáp án đúng)</>
              )}
            </div>
            
            <div className="help-section-formatting">
              <h4>📝 Format văn bản trong explanation:</h4>
              <ul className="help-list">
                <li><code>**text**</code> → <strong>text in đậm</strong></li>
                <li><code>\n</code> hoặc <code>\\n</code> → Xuống dòng</li>
                <li><code>$\rightarrow$</code> → Mũi tên →</li>
                <li><code>$\leftarrow$</code> → Mũi tên ←</li>
                <li><code>$\Rightarrow$</code> → Mũi tên ⇒</li>
              </ul>
              <p className="help-text-small">
                <strong>Ví dụ:</strong> <code>"explanation": "**Giải thích:**\\nBước 1: Tính toán\\nBước 2: Kết luận $\rightarrow$ Đáp án A"</code>
              </p>
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
