import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { attemptService } from '../../services/attemptService';
import { useQuizStore } from '../../store/quizStore';
import { useAuthStore } from '../../store/authStore';
import { parseBoldText } from '../../utils/textFormat';
import './ToeicQuiz.css';

export default function ToeicQuiz() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { attempt, questions, currentQuestionIndex, answers, setAttempt, setQuestions, nextQuestion, previousQuestion, setAnswer, goToQuestion } = useQuizStore();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAnswerMode, setShowAnswerMode] = useState<'immediate' | 'after-submit'>('immediate');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  useEffect(() => {
    initializeQuiz();
  }, []);

  const initializeQuiz = async () => {
    try {
      const config = location.state?.config || {};
      const newAttempt = await attemptService.create(id!, config);
      setAttempt(newAttempt);
      setQuestions((newAttempt.questionSet as any)?.questions || []);
      
      // Set showAnswerMode from config
      setShowAnswerMode(config.showAnswerMode || 'immediate');
      
      // Set time limit if timedMode is enabled
      if (config.timedMode && config.customTimeLimit) {
        setTimeLimit(config.customTimeLimit);
      }
    } catch (error) {
      console.error('Failed to start quiz', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit when time limit is reached
  useEffect(() => {
    if (timeLimit && timer >= timeLimit) {
      handleFinish();
    }
  }, [timer, timeLimit]);

  // Show warning when 5 minutes remaining
  useEffect(() => {
    if (timeLimit && timer === timeLimit - 300) { // 300 seconds = 5 minutes
      setShowTimeWarning(true);
      setTimeout(() => setShowTimeWarning(false), 5000); // Hide after 5 seconds
    }
  }, [timer, timeLimit]);

  useEffect(() => {
    // Load saved answer for current question
    if (questions[currentQuestionIndex]) {
      const currentQuestion = questions[currentQuestionIndex];
      const savedAnswer = answers.get(currentQuestion.id);
      if (savedAnswer !== undefined) {
        // ToeicQuiz only supports single choice, so convert array to number if needed
        const selectedOpt = savedAnswer.userAnswer.selectedOption;
        setSelectedOption(Array.isArray(selectedOpt) ? selectedOpt[0] : selectedOpt);
        // Only show answer if mode is immediate OR if already shown (hasChecked was true before)
        setHasChecked(showAnswerMode === 'immediate');
      } else {
        setSelectedOption(null);
        setHasChecked(false);
      }
    }
  }, [currentQuestionIndex, questions]); // Remove 'answers' and 'showAnswerMode' from dependencies

  const handleSelectOption = async (optionIndex: number) => {
    if (!attempt) return;
    
    // In immediate mode, don't allow re-selection after checking
    if (showAnswerMode === 'immediate' && hasChecked) return;
    
    setSelectedOption(optionIndex);
    
    // In after-submit mode, just mark selection without submitting
    if (showAnswerMode === 'after-submit') {
      return;
    }
    
    // In immediate mode, auto-submit answer immediately
    const currentQuestion = questions[currentQuestionIndex];
    const response = await attemptService.submitAnswer(attempt.id, currentQuestion.id, optionIndex);
    setAnswer(currentQuestion.id, response);
    setHasChecked(true);
  };

  const handleNext = async () => {
    // In after-submit mode, save answer before moving to next
    if (showAnswerMode === 'after-submit' && selectedOption !== null && !answers.has(currentQuestion.id)) {
      const response = await attemptService.submitAnswer(attempt!.id, currentQuestion.id, selectedOption);
      setAnswer(currentQuestion.id, response);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    }
  };

  const handlePrevious = async () => {
    // In after-submit mode, save answer before moving to previous
    if (showAnswerMode === 'after-submit' && selectedOption !== null && !answers.has(currentQuestion.id)) {
      const response = await attemptService.submitAnswer(attempt!.id, currentQuestion.id, selectedOption);
      setAnswer(currentQuestion.id, response);
    }
    
    if (currentQuestionIndex > 0) {
      previousQuestion();
    }
  };

  const handleGoToQuestion = async (index: number) => {
    // In after-submit mode, save answer before navigating
    if (showAnswerMode === 'after-submit' && selectedOption !== null && !answers.has(currentQuestion.id)) {
      const response = await attemptService.submitAnswer(attempt!.id, currentQuestion.id, selectedOption);
      setAnswer(currentQuestion.id, response);
    }
    
    goToQuestion(index);
    setShowSidebar(false);
  };

  const handleFinish = async () => {
    if (!attempt) return;
    
    // If mode is "after-submit", submit all pending answers first
    if (showAnswerMode === 'after-submit') {
      // Submit current question if selected but not submitted
      if (selectedOption !== null && !answers.has(currentQuestion.id)) {
        const response = await attemptService.submitAnswer(attempt.id, currentQuestion.id, selectedOption);
        setAnswer(currentQuestion.id, response);
      }
      
      // Show a confirmation dialog
      const confirmFinish = window.confirm(
        'Bạn sẽ xem được tất cả đáp án sau khi nộp bài. Bạn có chắc muốn nộp không?'
      );
      
      if (!confirmFinish) return;
    }
    
    await attemptService.complete(attempt.id, timer);
    navigate(`/quiz/${attempt.id}/results`);
  };

  // Parse structured explanation
  const parseExplanation = (explanation?: string) => {
    if (!explanation) return null;
    
    const lines = explanation.split('\n').filter(line => line.trim());
    const sections: { type: 'main' | 'correct' | 'incorrect' | 'translation', content: string }[] = [];
    
    let currentType: 'main' | 'correct' | 'incorrect' | 'translation' = 'main';
    let currentContent = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('✓') || trimmed.toLowerCase().includes('đáp án đúng') || trimmed.toLowerCase().includes('correct answer')) {
        if (currentContent) sections.push({ type: currentType, content: currentContent });
        currentType = 'correct';
        currentContent = trimmed;
      } else if (trimmed.startsWith('✗') || trimmed.toLowerCase().includes('đáp án sai') || trimmed.toLowerCase().includes('incorrect')) {
        if (currentContent) sections.push({ type: currentType, content: currentContent });
        currentType = 'incorrect';
        currentContent = trimmed;
      } else if (trimmed.startsWith('Dịch:') || trimmed.toLowerCase().includes('translation:') || trimmed.startsWith('🔤')) {
        if (currentContent) sections.push({ type: currentType, content: currentContent });
        currentType = 'translation';
        currentContent = trimmed;
      } else {
        if (currentContent) currentContent += '\n';
        currentContent += trimmed;
      }
    }
    
    if (currentContent) sections.push({ type: currentType, content: currentContent });
    
    return sections.length > 0 ? sections : null;
  };

  if (!questions.length) return <div className="container"><div className="spinner" /></div>;

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);

  return (
    <div className="toeic-quiz-container">
      {showTimeWarning && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px 24px',
          zIndex: 9999,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          fontWeight: '600',
          color: '#92400e'
        }}>
          ⚠️ Bài làm của bạn sẽ tự động nộp sau 5 phút
        </div>
      )}
      
      <div className="toeic-main-header">
        <h1 className="main-header-title"></h1>
        <div className="main-header-controls">
          <button className="btn-submit" onClick={handleFinish}>
            NỘP BÀI
          </button>
          <div className="timer-display">
            {String(Math.floor(timer / 3600)).padStart(2, '0')}:
            {String(Math.floor((timer % 3600) / 60)).padStart(2, '0')}:
            {String(timer % 60).padStart(2, '0')}
          </div>
          <div className="user-display">{user?.name || 'Người dùng'}</div>
          
          <button 
            className="btn-grid"
            onClick={() => setShowSidebar(!showSidebar)}
            title="Xem lưới câu hỏi"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="toeic-sub-header">
        <span className="current-part">Practice</span>
        <div className="navigation-controls">
          <button 
            onClick={handlePrevious} 
            className="btn-nav" 
            disabled={currentQuestionIndex === 0}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10 2L4 8l6 6" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            Câu trước
          </button>

          
          <button 
            onClick={handleNext} 
            className="btn-nav"
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Câu tiếp
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 2l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>
        </div>
        <div className="progress-indicator">
          {currentQuestionIndex + 1}/{questions.length}
        </div>
      </div>

      {showSidebar && (
        <div className="question-navigation-sidebar">
          <button className="btn-close-sidebar" onClick={() => setShowSidebar(false)}>
              ✕
          </button>
          <div className="nav-grid">
            {questions.map((q, index) => (
              <button
                key={q.id}
                className={`nav-button ${index === currentQuestionIndex ? 'active' : ''} ${answers.has(q.id) ? 'answered' : ''}`}
                onClick={() => handleGoToQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="toeic-content">
        <div className="toeic-main-content">
          {1 ? (
            <>
              <div className="toeic-passage">
                <div className="passage-text">{currentQuestion.passageText}</div>
              </div>

              <div className="toeic-question">
                <div className="question-content">
                  <p className="question-text">{currentQuestion.questionText}</p>

                  <div className="options-list">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const isCorrect = currentAnswer?.correctAnswer === index;
                      const isWrong = hasChecked && isSelected && !isCorrect;
                      
                      // In after-submit mode, don't show correct/incorrect until finished
                      const shouldShowFeedback = showAnswerMode === 'immediate' && hasChecked;
                      
                      return (
                        <button
                          key={index}
                          className={`option-button ${isSelected ? 'selected' : ''} ${
                            shouldShowFeedback ? (isCorrect ? 'correct' : isWrong ? 'incorrect' : '') : ''
                          }`}
                          onClick={() => handleSelectOption(index)}
                          disabled={showAnswerMode === 'immediate' && hasChecked}
                        >
                          <span className="option-letter"></span>
                          <span className="option-text">{option}</span>
                          {shouldShowFeedback && isCorrect && <span className="check-icon">✓</span>}
                          {shouldShowFeedback && isWrong && <span className="cross-icon">✗</span>}
                        </button>
                      );
                    })}
                  </div>

                  {showAnswerMode === 'immediate' && selectedOption !== null && currentAnswer?.explanation && (
                    <div className="explanation-box">
                      <h4 className="explanation-title">Giải thích chi tiết</h4>
                      {(() => {
                        const sections = parseExplanation(currentAnswer.explanation);
                        if (sections) {
                          return (
                            <div className="explanation-sections">
                              {sections.map((section, idx) => (
                                <div key={idx} className={`explanation-section section-${section.type}`}>
                                  {section.type === 'correct' && <div className="section-icon">✓</div>}
                                  {section.type === 'incorrect' && <div className="section-icon">✗</div>}
                                  {section.type === 'translation' && <div className="section-icon">🔤</div>}
                                  <div 
                                    className="section-content"
                                    dangerouslySetInnerHTML={{ __html: parseBoldText(section.content) }}
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <p 
                            className="explanation-text"
                            dangerouslySetInnerHTML={{ __html: parseBoldText(currentAnswer.explanation) }}
                          />
                        );
                      })()}
                    </div>
                  )}
                  {showAnswerMode === 'after-submit' && hasChecked && currentAnswer?.explanation && (
                    <div className="explanation-box">
                      <h4 className="explanation-title">💡 Giải thích chi tiết</h4>
                      {(() => {
                        const sections = parseExplanation(currentAnswer.explanation);
                        if (sections) {
                          return (
                            <div className="explanation-sections">
                              {sections.map((section, idx) => (
                                <div key={idx} className={`explanation-section section-${section.type}`}>
                                  {section.type === 'correct' && <div className="section-icon">✓</div>}
                                  {section.type === 'incorrect' && <div className="section-icon">✗</div>}
                                  {section.type === 'translation' && <div className="section-icon">🔤</div>}
                                  <div 
                                    className="section-content"
                                    dangerouslySetInnerHTML={{ __html: parseBoldText(section.content) }}
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <p 
                            className="explanation-text"
                            dangerouslySetInnerHTML={{ __html: parseBoldText(currentAnswer.explanation) }}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="toeic-question toeic-question-full">
              <div className="question-content">
                <p className="question-text">{currentQuestion.questionText}</p>

                <div className="options-list">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = currentAnswer?.correctAnswer === index;
                    const isWrong = hasChecked && isSelected && !isCorrect;
                    
                    // In after-submit mode, don't show correct/incorrect until finished
                    const shouldShowFeedback = showAnswerMode === 'immediate' && hasChecked;
                    
                    return (
                      <button
                        key={index}
                        className={`option-button ${isSelected ? 'selected' : ''} ${
                          shouldShowFeedback ? (isCorrect ? 'correct' : isWrong ? 'incorrect' : '') : ''
                        }`}
                        onClick={() => handleSelectOption(index)}
                        disabled={showAnswerMode === 'immediate' && hasChecked}
                      >
                        <span className="option-letter"></span>
                        <span className="option-text">{option}</span>
                        {shouldShowFeedback && isCorrect && <span className="check-icon">✓</span>}
                        {shouldShowFeedback && isWrong && <span className="cross-icon">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {showAnswerMode === 'immediate' && selectedOption !== null && currentAnswer?.explanation && (
                  <div className="explanation-box">
                    <h4 className="explanation-title">💡 Giải thích chi tiết</h4>
                    {(() => {
                      const sections = parseExplanation(currentAnswer.explanation);
                      if (sections) {
                        return (
                          <div className="explanation-sections">
                            {sections.map((section, idx) => (
                              <div key={idx} className={`explanation-section section-${section.type}`}>
                                {section.type === 'correct' && <div className="section-icon">✓</div>}
                                {section.type === 'incorrect' && <div className="section-icon">✗</div>}
                                {section.type === 'translation' && <div className="section-icon">🔤</div>}
                                <div className="section-content">{section.content}</div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p className="explanation-text">{currentAnswer.explanation}</p>;
                    })()}
                  </div>
                )}
                {showAnswerMode === 'after-submit' && hasChecked && currentAnswer?.explanation && (
                  <div className="explanation-box">
                    <h4 className="explanation-title">💡 Giải thích chi tiết</h4>
                    {(() => {
                      const sections = parseExplanation(currentAnswer.explanation);
                      if (sections) {
                        return (
                          <div className="explanation-sections">
                            {sections.map((section, idx) => (
                              <div key={idx} className={`explanation-section section-${section.type}`}>
                                {section.type === 'correct' && <div className="section-icon">✓</div>}
                                {section.type === 'incorrect' && <div className="section-icon">✗</div>}
                                {section.type === 'translation' && <div className="section-icon">🔤</div>}
                                <div className="section-content">{section.content}</div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p className="explanation-text">{currentAnswer.explanation}</p>;
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
