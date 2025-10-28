import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionSetService } from '../../services/questionSetService';
import { QuestionSet, AttemptConfig } from '../../types';
import { useQuizStore } from '../../store/quizStore';
import './QuizConfig.css';

export default function QuizConfig() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reset = useQuizStore(state => state.reset);
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [config, setConfig] = useState<AttemptConfig>({
    practiceMode: true,
    timedMode: false,
    autoAdvance: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    showAnswerMode: 'immediate', // Default to immediate for both modes
  });

  useEffect(() => {
    // Reset quiz store when entering config page (for Try Again)
    reset();
    
    if (id) {
      questionSetService.getById(id).then(setQuestionSet);
    }
  }, [id, reset]);

  const handleStart = () => {
    const path = questionSet?.mode === 'TOEIC' ? 'toeic' : 'school';
    navigate(`/quiz/${id}/${path}`, { state: { config } });
  };

  if (!questionSet) {
    return <div className="container"><div className="spinner" /></div>;
  }

  return (
    <div className="container quiz-config-container">
      <div className="quiz-config-card card">
        <h1 className="config-title">Cấu hình: {questionSet.title}</h1>
        <div className="config-options">
          {/* Common option for both TOEIC and SCHOOL */}
          <div className="config-section">
            <h3 className="config-section-title">Cài đặt hiển thị</h3>
            
            <div className="config-option">
              <input
                type="checkbox"
                id="showAnswerMode"
                checked={config.showAnswerMode === 'after-submit'}
                onChange={(e) => {
                  const isAfterSubmit = e.target.checked;
                  setConfig({ 
                    ...config, 
                    showAnswerMode: isAfterSubmit ? 'after-submit' : 'immediate',
                    // If enabling after-submit, disable practice mode
                    practiceMode: isAfterSubmit ? false : config.practiceMode
                  });
                }}
              />
              <label htmlFor="showAnswerMode">
                <strong>Hiển thị đáp án sau khi nộp bài</strong>
              </label>
            </div>
          </div>

          {questionSet.mode === 'SCHOOL' && (
            <div className="config-section">
              <h3 className="config-section-title">Cài đặt bài thi trắc nghiệm</h3>
              
              <div className="config-option">
                <input
                  type="checkbox"
                  id="practiceMode"
                  checked={config.practiceMode}
                  onChange={(e) => {
                    const isPractice = e.target.checked;
                    setConfig({ 
                      ...config, 
                      practiceMode: isPractice,
                      // If enabling practice mode, set to immediate mode
                      showAnswerMode: isPractice ? 'immediate' : config.showAnswerMode
                    });
                  }}
                />
                <label htmlFor="practiceMode">
                  <strong>Làm lại câu sai</strong>
                </label>
              </div>

              <div className="config-option">
                <input
                  type="checkbox"
                  id="shuffleQuestions"
                  checked={config.shuffleQuestions}
                  onChange={(e) => setConfig({ ...config, shuffleQuestions: e.target.checked })}
                />
                <label htmlFor="shuffleQuestions">
                  <strong>Đảo câu hỏi</strong>
                </label>
              </div>

              <div className="config-option">
                <input
                  type="checkbox"
                  id="shuffleOptions"
                  checked={config.shuffleOptions}
                  onChange={(e) => setConfig({ ...config, shuffleOptions: e.target.checked })}
                />
                <label htmlFor="shuffleOptions">
                  <strong>Đảo đáp án</strong>
                </label>
              </div>
            </div>
          )}
          <div className="config-section">
            <h3 className="config-section-title">Cài đặt thời gian</h3>
            
            <div className="config-option">
              <input
                type="checkbox"
                id="timedMode"
                checked={config.timedMode}
                onChange={(e) => setConfig({ ...config, timedMode: e.target.checked })}
              />
              <label htmlFor="timedMode">
                <strong>Chế độ tính giờ</strong>
              </label>
            </div>

            {config.timedMode && (
              <div className="input-group">
                <label htmlFor="timeLimit">Giới hạn thời gian (phút)</label>
                <input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={config.customTimeLimit ? config.customTimeLimit / 60 : ''}
                  onChange={(e) => setConfig({ ...config, customTimeLimit: parseInt(e.target.value) * 60 })}
                />
              </div>
            )}
          </div>

          {questionSet.mode === 'SCHOOL' && (
            <div className="config-section">
              <h3 className="config-section-title">Cài đặt chuyển câu</h3>
              
              <div className="config-option">
                <input
                  type="checkbox"
                  id="autoAdvance"
                  checked={config.autoAdvance}
                  onChange={(e) => setConfig({ ...config, autoAdvance: e.target.checked })}
                />
                <label htmlFor="autoAdvance">
                  <strong>Tự động chuyển câu</strong>
                </label>
              </div>

              {config.autoAdvance && (
                <div className="input-group">
                  <label htmlFor="autoAdvanceTime">Chuyển câu sau (giây)</label>
                  <input
                    id="autoAdvanceTime"
                    type="number"
                    min="1"
                    max="10"
                    value={config.autoAdvanceTime || 3}
                    onChange={(e) => setConfig({ ...config, autoAdvanceTime: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="config-actions">
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Hủy
          </button>
          <button onClick={handleStart} className="btn btn-primary">
            Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}
