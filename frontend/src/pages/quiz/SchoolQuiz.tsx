import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { attemptService } from '../../services/attemptService';
import { useQuizStore } from '../../store/quizStore';
import { Question } from '../../types';
import { highlightCode } from '../../utils/syntaxHighlight';
import { parseBoldText } from '../../utils/textFormat';
import './SchoolQuiz.css';

interface QuestionWithRetries extends Question {
  originalIndex?: number;
  originalCorrectAnswer?: number | number[]; // Store original correct answer before shuffle
  optionMapping?: number[]; // Map shuffled index to original index
  isRetrying?: boolean; // Mark when question is being retried due to wrong answer
  displayIndex?: number; // Store the display position (1-based) for showing in progress text
}

export default function SchoolQuiz() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { attempt, setAttempt } = useQuizStore();
  const [questionQueue, setQuestionQueue] = useState<QuestionWithRetries[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<any>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set()); // Track all submitted questions
  const [totalUniqueQuestions, setTotalUniqueQuestions] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showAnswerMode, setShowAnswerMode] = useState<'immediate' | 'after-submit'>('immediate');
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeQuiz();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only allow navigation if feedback is shown (answer submitted)
      if (!feedback) return;
      
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, currentQuestionIndex, questionQueue, answeredQuestions, isPracticeMode, totalUniqueQuestions]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
      }
    };
  }, [autoAdvanceTimer]);

  const initializeQuiz = async () => {
    try {
      const config = location.state?.config || {};
      const newAttempt = await attemptService.create(id!, config);
      setAttempt(newAttempt);
      setIsPracticeMode(config.practiceMode || false);
      setShowAnswerMode(config.showAnswerMode || 'immediate');
      
      let initialQuestions = ((newAttempt.questionSet as any)?.questions || []).map((q: Question, idx: number) => ({
        ...q,
        originalIndex: idx,
        originalCorrectAnswer: q.correctAnswer,
        displayIndex: idx + 1, // Store 1-based display position
      }));
      
      // Shuffle questions if configured
      if (config.shuffleQuestions) {
        initialQuestions = shuffleArray(initialQuestions);
      }
      
      // After shuffling, set displayIndex based on new positions
      initialQuestions = initialQuestions.map((q: QuestionWithRetries, idx: number) => ({
        ...q,
        displayIndex: idx + 1, // Update display position after shuffle
      }));
      
      // Shuffle options if configured - keep track of original indices
      if (config.shuffleOptions) {
        initialQuestions = initialQuestions.map((q: QuestionWithRetries) => {
          // Create array with indices and options
          const indexedOptions = q.options.map((opt, idx) => ({ option: opt, originalIndex: idx }));
          
          // Shuffle the indexed options
          const shuffledIndexedOptions = shuffleArray(indexedOptions);
          
          // Extract shuffled options and create mapping
          const shuffledOptions = shuffledIndexedOptions.map(item => item.option);
          const optionMapping = shuffledIndexedOptions.map(item => item.originalIndex);
          
          // Find new position(s) of correct answer(s)
          let newCorrectAnswer: number | number[];
          if (Array.isArray(q.correctAnswer)) {
            // Multiple correct answers
            newCorrectAnswer = q.correctAnswer.map(correctIdx => 
              shuffledIndexedOptions.findIndex(item => item.originalIndex === correctIdx)
            );
          } else {
            // Single correct answer
            newCorrectAnswer = shuffledIndexedOptions.findIndex(
              item => item.originalIndex === q.correctAnswer
            );
          }
          
          return {
            ...q,
            options: shuffledOptions,
            correctAnswer: newCorrectAnswer,
            optionMapping,
          };
        });
      }
      
      setQuestionQueue(initialQuestions);
      setTotalUniqueQuestions(initialQuestions.length);
    } catch (error) {
      console.error('Failed to start quiz', error);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleSelectAndSubmit = async (optionIndex: number) => {
    if (!attempt || feedback) return; // Don't allow changes after submission
    
    const currentQuestion = questionQueue[currentQuestionIndex];
    const isMultipleChoice = currentQuestion.questionType === 'multiple';

    // Handle multiple choice
    if (isMultipleChoice) {
      const newSelectedOptions = new Set(selectedOptions);
      if (newSelectedOptions.has(optionIndex)) {
        newSelectedOptions.delete(optionIndex);
      } else {
        newSelectedOptions.add(optionIndex);
      }
      setSelectedOptions(newSelectedOptions);

      // Don't auto-submit, let user click Submit button
      return;
    }

    // Handle single choice
    // In "after-submit" mode, allow reselection without submitting
    if (showAnswerMode === 'after-submit') {
      setSelectedOption(optionIndex);
      return;
    }

    // In immediate mode, submit immediately
    setSelectedOption(optionIndex);
    await submitAnswer(optionIndex);
  };

    const submitAnswer = async (answer: number | number[]) => {
    if (!attempt) return;

    const currentQuestion = questionQueue[currentQuestionIndex];
    
    // Convert shuffled option index back to original index for backend
    let originalAnswer: number | number[];
    if (Array.isArray(answer)) {
      originalAnswer = answer.map(idx => 
        currentQuestion.optionMapping ? currentQuestion.optionMapping[idx] : idx
      );
    } else {
      originalAnswer = currentQuestion.optionMapping 
        ? currentQuestion.optionMapping[answer]
        : answer;
    }
    
    const response = await attemptService.submitAnswer(attempt.id, currentQuestion.id, originalAnswer);
    
    // Track all submitted questions (for progress bar in after-submit mode)
    setSubmittedQuestions(prev => new Set(prev).add(currentQuestion.id));
    
    // Only set feedback in immediate mode
    if (showAnswerMode === 'immediate') {
      setFeedback(response);

      // Track answered questions (only count correct answers)
      if (response.isCorrect) {
        setAnsweredQuestions(prev => new Set(prev).add(currentQuestion.id));
      }

      // Auto-advance after delay if configured
      if (attempt.autoAdvance) {
        const timer = setTimeout(() => {
          handleNext(response.isCorrect);
        }, (attempt.autoAdvanceTime || 3) * 1000);
        setAutoAdvanceTimer(timer);
      }
    }
    
    // Return response for after-submit mode to use
    return response;
  };  
  const handleNext = async (isCorrect?: boolean) => {
    // Clear auto-advance timer if exists
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }

    // If in after-submit mode and no feedback yet, submit the answer first
    if (showAnswerMode === 'after-submit' && !feedback) {
      const isMultipleChoice = currentQuestion.questionType === 'multiple';
      const hasAnswer = isMultipleChoice ? selectedOptions.size > 0 : selectedOption !== null;
      
      if (hasAnswer) {
        // Submit the answer and get the response
        let response: any;
        if (isMultipleChoice) {
          response = await submitAnswer(Array.from(selectedOptions));
        } else if (selectedOption !== null) {
          response = await submitAnswer(selectedOption);
        }
        // In after-submit mode, don't show feedback, proceed immediately to next question
        // Use the response to determine if answer was correct for practice mode
        const wasCorrect = response?.isCorrect || false;
        
        // Reset state
        setSelectedOption(null);
        setSelectedOptions(new Set());
        setFeedback(null);

        // Track answered questions (only count correct answers)
        if (wasCorrect && response) {
          setAnsweredQuestions(prev => new Set(prev).add(currentQuestion.id));
        }

        // Continue to practice mode retry logic below
        if (isPracticeMode && !wasCorrect) {
          // Only add retry if this question hasn't been answered correctly before
          if (!answeredQuestions.has(currentQuestion.id)) {
            const retryQuestion = { 
              ...currentQuestion,
              isRetrying: true, // Mark as retrying
              displayIndex: currentQuestion.displayIndex, // Keep original display position
            };

            const remainingQuestions = questionQueue.slice(currentQuestionIndex + 1);
            
            if (remainingQuestions.length > 0) {
              // Insert retry question randomly, but at least 3 positions away
              const minGap = 3;
              const maxGap = remainingQuestions.length;
              const insertPosition = minGap >= maxGap 
                ? maxGap 
                : Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
              
              const newQueue = [
                ...questionQueue.slice(0, currentQuestionIndex + 1),
                ...remainingQuestions.slice(0, insertPosition),
                retryQuestion,
                ...remainingQuestions.slice(insertPosition),
              ];
              setQuestionQueue(newQueue);
            } else {
              setQuestionQueue([...questionQueue, retryQuestion]);
            }
          }
        }

        // Move to next question or complete
        if (currentQuestionIndex < questionQueue.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          if (isPracticeMode && answeredQuestions.size < totalUniqueQuestions) {
            return;
          }
          completeQuiz();
        }
        return;
      }
    }

    const wasCorrect = isCorrect !== undefined ? isCorrect : feedback?.isCorrect;
    
    setSelectedOption(null);
    setSelectedOptions(new Set());
    setFeedback(null);

    // Practice mode: re-add incorrect question to queue
    if (isPracticeMode && !wasCorrect) {
      const currentQuestion = questionQueue[currentQuestionIndex];
      
      // Only add retry if this question hasn't been answered correctly before
      if (!answeredQuestions.has(currentQuestion.id)) {
        const retryQuestion = { 
          ...currentQuestion,
          isRetrying: true, // Mark as retrying
          displayIndex: currentQuestion.displayIndex, // Keep original display position
        };

        // Get remaining questions after current
        const remainingQuestions = questionQueue.slice(currentQuestionIndex + 1);
        
        // If there are remaining questions, insert retry question randomly but at least 3 positions away
        if (remainingQuestions.length > 0) {
          // Insert retry question randomly, but at least 3 positions away
          const minGap = 3;
          const maxGap = remainingQuestions.length;
          const insertPosition = minGap >= maxGap 
            ? maxGap 
            : Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
          
          const newQueue = [
            ...questionQueue.slice(0, currentQuestionIndex + 1),
            ...remainingQuestions.slice(0, insertPosition),
            retryQuestion,
            ...remainingQuestions.slice(insertPosition),
          ];
          setQuestionQueue(newQueue);
        } else {
          // If no remaining questions, just add retry question to end
          setQuestionQueue([...questionQueue, retryQuestion]);
        }
      }
    }

    // Move to next question or complete
    if (currentQuestionIndex < questionQueue.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // In practice mode, only complete when all unique questions are answered correctly
      if (isPracticeMode && answeredQuestions.size < totalUniqueQuestions) {
        // Not done yet, stay on current position (will loop back)
        return;
      }
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    if (!attempt) return;
    const timeTaken = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
    await attemptService.complete(attempt.id, timeTaken);
    navigate(`/quiz/${attempt.id}/results`);
  };

  const handleSubmitQuiz = () => {
    if (window.confirm('Bạn có chắc chắn muốn nộp bài ngay bây giờ?')) {
      completeQuiz();
    }
  };

  const handleExitQuiz = () => {
    if (window.confirm('Bạn có chắc chắn muốn thoát? Kết quả sẽ không được lưu.')) {
      navigate('/');
    }
  };

  const handleSubmitMultipleChoice = async () => {
    if (selectedOptions.size === 0) return;
    await submitAnswer(Array.from(selectedOptions));
  };

  if (!questionQueue.length) return <div className="container"><div className="spinner" /></div>;

  const currentQuestion = questionQueue[currentQuestionIndex];
  
  // Calculate current question number for display based on position in queue
  // For retry questions, use the original displayIndex. Otherwise use current position.
  const getCurrentQuestionNumber = () => {
    if (currentQuestion.isRetrying || currentQuestion.isRetry) {
      // For retry questions, show their original display position
      return currentQuestion.displayIndex ?? (currentQuestionIndex + 1);
    }
    // For non-retry questions, use displayIndex if available (set during init/shuffle)
    // This ensures we don't exceed totalUniqueQuestions
    if (currentQuestion.displayIndex !== undefined) {
      return currentQuestion.displayIndex;
    }
    // Fallback to current position in queue
    return currentQuestionIndex + 1;
  };
  
  const progressText = `Câu hỏi: ${getCurrentQuestionNumber()} / ${totalUniqueQuestions}`;
  const isMultipleChoice = currentQuestion.questionType === 'multiple';
  const hasAnswer = isMultipleChoice ? selectedOptions.size > 0 : selectedOption !== null;
  
  // Calculate progress percentage based on mode
  // - Immediate mode: count only correct answers
  // - After-submit mode: count all submitted questions
  const progressPercentage = showAnswerMode === 'after-submit'
    ? Math.round((submittedQuestions.size / totalUniqueQuestions) * 100)
    : Math.round((answeredQuestions.size / totalUniqueQuestions) * 100);

  return (
    <div className="school-quiz-container">
      {/* Header with progress bar and action buttons */}
      <div className="school-quiz-header">
        <div className="header-content" style={{ padding: 0 }}>
          <div className="progress-info">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="progress-percentage">{progressPercentage}%</span>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleExitQuiz} 
              className="btn btn-secondary btn-sm"
              title="Thoát không lưu kết quả"
            >
              Thoát
            </button>
            <button 
              onClick={handleSubmitQuiz} 
              className="btn btn-primary btn-sm"
              title="Nộp bài và xem kết quả"
            >
              Nộp bài
            </button>
          </div>
        </div>
      </div>

      <div className="school-quiz-card">
        <div className="question-number">
          {progressText}
          {(currentQuestion.isRetry || currentQuestion.isRetrying) && (
            <span className="retry-badge">Làm lại</span>
          )}
          {isMultipleChoice && (
            <span className="question-type-badge">Chọn nhiều đáp án</span>
          )}
        </div>

        <h2 className="question-text">{currentQuestion.questionText}</h2>

        {currentQuestion.codeBlock && (
          <div className="code-block-container">
            <pre><code dangerouslySetInnerHTML={{ __html: highlightCode(currentQuestion.codeBlock) }} /></pre>
          </div>
        )}

        <div className="options-list">
          {currentQuestion.options.map((option, index) => {
            // Handle single and multiple selection
            const isSelected = isMultipleChoice 
              ? selectedOptions.has(index)
              : selectedOption === index;
            
            // Handle correct answer display for both single and multiple
            let isCorrectAnswer = false;
            let isWrongSelected = false;
            
            if (feedback) {
              if (Array.isArray(feedback.correctAnswer)) {
                // Multiple choice: check if this option is in correct answers
                const correctAnswersInShuffledOrder = feedback.correctAnswer.map((ca: number) =>
                  currentQuestion.optionMapping 
                    ? currentQuestion.optionMapping.indexOf(ca)
                    : ca
                );
                isCorrectAnswer = correctAnswersInShuffledOrder.includes(index);
                isWrongSelected = isSelected && !isCorrectAnswer;
              } else {
                // Single choice
                const correctAnswerInShuffledOrder = currentQuestion.optionMapping
                  ? currentQuestion.optionMapping.indexOf(feedback.correctAnswer)
                  : feedback.correctAnswer;
                isCorrectAnswer = index === correctAnswerInShuffledOrder;
                isWrongSelected = feedback && !feedback.isCorrect && isSelected;
              }
            }
            
            // Show feedback based on mode
            const shouldShowFeedback = showAnswerMode === 'immediate' ? !!feedback : false;
            
            return (
              <button
                key={index}
                className={`option-button ${isMultipleChoice ? 'multiple-choice' : ''} ${isSelected ? 'selected' : ''} ${
                  shouldShowFeedback && isCorrectAnswer ? 'correct' : shouldShowFeedback && isWrongSelected ? 'incorrect' : ''
                }`}
                onClick={() => handleSelectAndSubmit(index)}
                disabled={isPracticeMode && !!feedback}
              >
                <span className={isMultipleChoice ? 'option-checkbox' : 'option-circle'} />
                <span className="option-text">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Show explanation in immediate mode when answer is wrong */}
        {showAnswerMode === 'immediate' && feedback && !feedback.isCorrect && currentQuestion.explanation && (
          <div className="explanation-box">
            <h4 className="explanation-title">💡 Giải thích</h4>
            <p 
              className="explanation-text"
              dangerouslySetInnerHTML={{ __html: parseBoldText(currentQuestion.explanation) }}
            />
          </div>
        )}

        {/* Show Submit/Next button */}
        <div className="next-button-container">
          {/* Multiple choice in immediate mode: Show Submit button when answer selected but not submitted */}
          {isMultipleChoice && showAnswerMode === 'immediate' && hasAnswer && !feedback && (
            <button 
              onClick={handleSubmitMultipleChoice} 
              className="btn btn-primary next-button"
            >
              Submit
            </button>
          )}

          {/* Show Next button after feedback or for single choice */}
          {((!isMultipleChoice && hasAnswer) || feedback) && (
            <>
              <button onClick={() => handleNext()} className="btn btn-primary next-button">
                {isPracticeMode && answeredQuestions.size < totalUniqueQuestions 
                  ? 'Câu tiếp →' 
                  : currentQuestionIndex < questionQueue.length - 1 
                  ? 'Câu tiếp →' 
                  : 'Xem kết quả'}
              </button>
              {feedback && (
                <div className="keyboard-hint">
                  Nhấn <kbd>→</kbd> hoặc <kbd>Enter</kbd> để chuyển câu
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
