import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService } from '../../services/attemptService';
import { Attempt } from '../../types';
import { parseBoldText } from '../../utils/textFormat';
import './QuizResults.css';

export default function QuizResults() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scrollToQuestion = (index: number) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleTabClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleQuestionClick = (index: number) => {
    scrollToQuestion(index);
    // Đóng sidebar trên mobile sau khi chọn câu
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (attemptId) {
      attemptService.getById(attemptId).then(setAttempt);
    }
  }, [attemptId]);

  if (!attempt) {
    return <div className="container"><div className="spinner" /></div>;
  }

  const percentage = attempt.score || 0;

  // Calculate unique questions answered correctly (for practice mode)
  const uniqueCorrectAnswers = attempt.userAnswers 
    ? new Set(
        attempt.userAnswers
          .filter(ans => ans.isCorrect)
          .map(ans => ans.questionId)
      ).size
    : attempt.correctAnswers;

  // Get actual total unique questions from question set
  const actualTotalQuestions = (attempt.questionSet as any)?.questions?.length || attempt.totalQuestions;

  // Get mode to determine display style
  const isToeicMode = attempt.questionSet?.mode === 'TOEIC';

  // Group user answers by question to handle duplicates (practice mode retries)
  const questionAnswersMap = new Map();
  if (attempt.userAnswers && attempt.questionSet?.questions) {
    attempt.userAnswers.forEach(answer => {
      if (!questionAnswersMap.has(answer.questionId)) {
        const question = (attempt.questionSet as any).questions.find((q: any) => q.id === answer.questionId);
        if (question) {
          questionAnswersMap.set(answer.questionId, {
            question,
            answers: [],
          });
        }
      }
      questionAnswersMap.get(answer.questionId)?.answers.push(answer);
    });
  }

  // Get sorted questions with their answers
  const questionsWithAnswers = Array.from(questionAnswersMap.values())
    .sort((a, b) => a.question.orderIndex - b.question.orderIndex);

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="results-actions">
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            ← Về trang chủ
          </button>
          <button onClick={() => navigate(`/quiz/${attempt.questionSetId}/config`)} className="btn btn-primary">
            Làm lại
          </button>
        </div>
      </div>

      <div className="results-content">
        {questionsWithAnswers.length > 0 && (
          <div 
            className={`sidebar-container ${(isSidebarHovered || isSidebarOpen) ? 'expanded' : 'collapsed'}`}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
          >
            <div className="sidebar-tab" onClick={handleTabClick}>
              <span>📋</span>
            </div>
            
            <div className="question-navigation-sidebar">
              <div className="sidebar-content">
                <h4>Câu hỏi</h4>
                <div className="nav-grid">
                  {questionsWithAnswers.map((item, index) => {
                    const lastAnswer = item.answers[item.answers.length - 1];
                    const isCorrect = lastAnswer.isCorrect;
                    
                    return (
                      <button
                        key={item.question.id}
                        className={`nav-button ${isCorrect ? 'correct' : 'incorrect'}`}
                        onClick={() => handleQuestionClick(index)}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="results-main">
          <div className="results-card card">
            <div className="results-stats">
              <div className="stat-item">
                <span className="stat-label">Số câu đúng</span>
                <span className="stat-value">{uniqueCorrectAnswers} / {actualTotalQuestions}</span>
              </div>
              <div className="stat-item">
                <div className="score-display">
                  <div className="score-circle">
                    <span className="score-number">{percentage}%</span>
                  </div>
                </div>
              </div>
              {attempt.timeTaken && (
                <div className="stat-item">
                  <span className="stat-label">Thời gian</span>
                  <span className="stat-value">
                    {Math.floor(attempt.timeTaken / 60)} phút {attempt.timeTaken % 60} giây
                  </span>
                </div>
              )}
            </div>

            {questionsWithAnswers.length > 0 && (
              <div className="answers-review">
                <h3>Xem lại đáp án</h3>
                {questionsWithAnswers.map((item, index) => {
              const { question, answers } = item;
              const lastAnswer = answers[answers.length - 1]; // Get the latest answer
              const isCorrect = lastAnswer.isCorrect;
              const userSelectedOption = lastAnswer.selectedOption;
              
              // Handle both single (number) and multiple (array) selections
              const userSelectedArray = Array.isArray(userSelectedOption) 
                ? userSelectedOption 
                : [userSelectedOption];
              
              // Handle both single (number) and multiple (array) correct answers
              const correctAnswerArray = Array.isArray(question.correctAnswer)
                ? question.correctAnswer
                : [question.correctAnswer];
              
              return (
                <div key={question.id} id={`question-${index}`} className={`answer-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="answer-header">
                    <span className="answer-number">Câu {index + 1}</span>
                    <span className={`answer-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                      {isCorrect ? '✓ Đúng' : '✗ Sai'}
                      {answers.length > 1 && ` (${answers.length} lần thử)`}
                    </span>
                  </div>
                  
                  {question.passageText && isToeicMode && (
                    <div className="answer-passage">
                      <strong>Đoạn văn:</strong>
                      <p>{question.passageText}</p>
                    </div>
                  )}
                  
                  <p className="answer-question-text">{question.questionText}</p>
                  
                  <div className="answer-options">
                    {question.options.map((option: string, optIdx: number) => {
                      const isUserChoice = userSelectedArray.includes(optIdx);
                      const isCorrectAnswer = correctAnswerArray.includes(optIdx);
                      
                      // Determine the CSS class
                      let optionClass = 'answer-option';
                      if (isCorrectAnswer) {
                        optionClass += ' correct-answer';
                      }
                      if (isUserChoice && !isCorrectAnswer) {
                        optionClass += ' wrong-answer';
                      }
                      if (isUserChoice && isCorrectAnswer) {
                        optionClass += ' user-correct';
                      }
                      
                      return (
                        <div key={optIdx} className={optionClass}>
                          <span className="option-label">{String.fromCharCode(65 + optIdx)}.</span>
                          <span className="option-text">{option}</span>
                          {isCorrectAnswer && (
                            <span className="correct-badge">✓ Đáp án đúng</span>
                          )}
                          {isUserChoice && !isCorrectAnswer && (
                            <span className="user-badge">
                              {'✗ Sai'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {question.explanation && (
                    <div className="answer-explanation">
                      <strong>Giải thích:</strong>
                      <p dangerouslySetInnerHTML={{ __html: parseBoldText(question.explanation) }} />
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
