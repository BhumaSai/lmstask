import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { quizAPI } from '../services/api';
import type { Quiz, QuizAttempt } from '../types';

interface QuizProps {
  lessonId: string;
  onComplete?: (score: number, passed: boolean) => void;
}

const Quiz: React.FC<QuizProps> = ({ lessonId, onComplete }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [results, setResults] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizAPI.getQuiz(lessonId);
        setQuiz(response.data.data);
        setTimeLeft(response.data.data.timeLimit * 60); // Convert minutes to seconds
        setAnswers(new Array(response.data.data.questions.length).fill(-1));
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [lessonId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !results) {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = answerIndex;
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Check if all questions are answered
    if (answers.some(answer => answer === -1)) {
      toast.error('Please answer all questions');
      return;
    }

    try {
      setSubmitting(true);
      const response = await quizAPI.submitQuiz(quiz!._id, { answers });
      setResults(response.data.data);
      onComplete?.(response.data.data.score, response.data.data.passed);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center text-red-600 p-4">
        Quiz not found
      </div>
    );
  }

  if (results) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
        <div className="mb-4">
          <div className="text-lg">
            Score: <span className="font-semibold">{results.score.toFixed(1)}%</span>
          </div>
          <div className="text-lg">
            Status: <span className={`font-semibold ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
              {results.passed ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {quiz.questions.map((question, qIndex) => {
            const answer = results.answers.find(a => a.questionIndex === qIndex);
            return (
              <div key={qIndex} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{qIndex + 1}. {question.question}</h3>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      className={`p-2 rounded ${
                        answer?.selectedAnswer === oIndex
                          ? answer.isCorrect
                            ? 'bg-green-100'
                            : 'bg-red-100'
                          : oIndex === question.correctAnswer
                          ? 'bg-green-100'
                          : 'bg-gray-50'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{quiz.title}</h2>
        <div className="text-lg font-semibold">
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>
      <div className="space-y-6">
        {quiz.questions.map((question, qIndex) => (
          <div key={qIndex} className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">{qIndex + 1}. {question.question}</h3>
            <div className="space-y-2">
              {question.options.map((option, oIndex) => (
                <label
                  key={oIndex}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-50 ${
                    answers[qIndex] === oIndex ? 'bg-primary-50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    checked={answers[qIndex] === oIndex}
                    onChange={() => handleAnswerSelect(qIndex, oIndex)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn btn-primary"
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  );
};

export default Quiz; 