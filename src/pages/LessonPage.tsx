import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, markLessonComplete, Course, Lesson, ContentBlock, QuizQuestion, Exercise } from '../utils/database';

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="text-slate-300 leading-relaxed mb-3">{block.content}</p>;
    case 'heading':
      return <h3 className="text-lg font-bold text-slate-100 mt-4 mb-2">{block.content}</h3>;
    case 'list':
      return (
        <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300 pr-4">
          {block.items?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'code':
      return (
        <div className="mb-3 rounded-lg overflow-hidden">
          {block.language && (
            <div className="bg-slate-900 px-3 py-1 text-xs text-slate-500 border-b border-slate-700">{block.language}</div>
          )}
          <pre className="bg-slate-900 p-4 text-sm text-green-400 overflow-x-auto" dir="ltr">
            <code>{block.content}</code>
          </pre>
        </div>
      );
    case 'note':
      return (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span>💡</span>
            <span className="text-sm font-bold text-blue-400">ملاحظة</span>
          </div>
          <p className="text-sm text-slate-300">{block.content}</p>
        </div>
      );
    case 'warning':
      return (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span>⚠️</span>
            <span className="text-sm font-bold text-amber-400">تنبيه</span>
          </div>
          <p className="text-sm text-slate-300">{block.content}</p>
        </div>
      );
    case 'image':
      return (
        <div className="mb-3">
          <img src={block.src} alt={block.alt || ''} className="rounded-lg max-w-full" />
        </div>
      );
    default:
      return null;
  }
}

function QuizSection({ quiz, onComplete }: { quiz: QuizQuestion[]; onComplete: (score: number, total: number) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  function handleAnswer(questionId: string, optionIdx: number) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  }

  function handleSubmit() {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    quiz.forEach(q => {
      totalPoints += q.points || 1;
      if (answers[q.id] === q.correctAnswer) {
        earnedPoints += q.points || 1;
      }
    });
    
    setScore(earnedPoints);
    setSubmitted(true);
    onComplete(earnedPoints, totalPoints);
  }

  const totalPoints = quiz.reduce((sum, q) => sum + (q.points || 1), 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
        <span>📝</span> الاختبار
      </h3>
      
      {quiz.map((q, qIdx) => {
        const isCorrect = submitted && answers[q.id] === q.correctAnswer;
        const isWrong = submitted && answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer;
        
        return (
          <div key={q.id} className={`bg-slate-800/50 rounded-xl p-4 border ${isCorrect ? 'border-green-500/50' : isWrong ? 'border-red-500/50' : 'border-slate-700/50'}`}>
            <p className="font-medium text-slate-200 mb-3">
              <span className="text-blue-400 ml-2">س{qIdx + 1}.</span>
              {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => {
                const isSelected = answers[q.id] === optIdx;
                const isCorrectOpt = submitted && optIdx === q.correctAnswer;
                
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswer(q.id, optIdx)}
                    disabled={submitted}
                    className={`w-full text-right p-3 rounded-lg border transition-all ${
                      isCorrectOpt ? 'bg-green-900/30 border-green-500/50 text-green-300' :
                      isSelected && isWrong ? 'bg-red-900/30 border-red-500/50 text-red-300' :
                      isSelected ? 'bg-blue-900/30 border-blue-500/50 text-blue-300' :
                      'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <div className="mt-3 bg-slate-700/30 rounded-lg p-3 text-sm text-slate-400">
                💡 {q.explanation}
              </div>
            )}
          </div>
        );
      })}
      
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < quiz.length}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all"
        >
          تسليم الإجابات ({Object.keys(answers).length}/{quiz.length})
        </button>
      )}
      
      {submitted && (
        <div className={`text-center p-4 rounded-xl ${score >= totalPoints / 2 ? 'bg-green-900/20 border border-green-700/30' : 'bg-red-900/20 border border-red-700/30'}`}>
          <div className="text-2xl font-bold">{score}/{totalPoints}</div>
          <div className="text-sm text-slate-400 mt-1">
            {score >= totalPoints / 2 ? '🎉 أحسنت!' : '💪 حاول مرة أخرى'}
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseSection({ exercises }: { exercises: Exercise[] }) {
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
        <span>💪</span> التمارين
      </h3>
      
      {exercises.map((ex) => (
        <div key={ex.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h4 className="font-bold text-slate-200 mb-2">{ex.title}</h4>
          <p className="text-sm text-slate-300 mb-2">{ex.description}</p>
          <div className="bg-slate-700/30 rounded-lg p-3 mb-3">
            <p className="text-sm text-slate-400"><strong>المطلوب:</strong> {ex.requirement}</p>
          </div>
          {ex.hint && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 mb-3">
              <p className="text-sm text-amber-300">💡 تلميح: {ex.hint}</p>
            </div>
          )}
          {ex.solution && (
            <button
              onClick={() => setShowSolutions(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showSolutions[ex.id] ? '🔼 إخفاء الحل' : '🔽 عرض الحل'}
            </button>
          )}
          {showSolutions[ex.id] && ex.solution && (
            <pre className="mt-2 bg-slate-900 p-3 rounded-lg text-sm text-green-400 overflow-x-auto" dir="ltr">
              <code>{ex.solution}</code>
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    loadData();
  }, [courseId, lessonId]);

  async function loadData() {
    if (!courseId || !lessonId) return;
    try {
      const courseData = await getCourse(courseId);
      if (!courseData) { setLoading(false); return; }
      setCourse(courseData);
      
      // Find the lesson
      let foundLesson: Lesson | null = null;
      for (const unit of courseData.units) {
        for (const l of unit.lessons) {
          if (l.id === lessonId) {
            foundLesson = l;
            break;
          }
        }
        if (foundLesson) break;
      }
      setLesson(foundLesson);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function getAllLessonsFlat(): { lesson: Lesson; unitIdx: number; lessonIdx: number }[] {
    if (!course) return [];
    const result: { lesson: Lesson; unitIdx: number; lessonIdx: number }[] = [];
    course.units.forEach((unit, unitIdx) => {
      unit.lessons.sort((a, b) => a.order - b.order).forEach((l, lessonIdx) => {
        result.push({ lesson: l, unitIdx, lessonIdx });
      });
    });
    return result;
  }

  function getPrevNextLesson() {
    const all = getAllLessonsFlat();
    const currentIdx = all.findIndex(l => l.lesson.id === lessonId);
    return {
      prev: currentIdx > 0 ? all[currentIdx - 1].lesson : null,
      next: currentIdx < all.length - 1 ? all[currentIdx + 1].lesson : null
    };
  }

  async function handleCompleteLesson() {
    if (!courseId || !lessonId) return;
    await markLessonComplete(courseId, lessonId, quizScore?.score, quizScore?.total);
    
    const { next } = getPrevNextLesson();
    if (next) {
      navigate(`/lesson/${courseId}/${next.id}`);
    } else {
      navigate(`/levels/${courseId}`);
    }
  }

  function handleQuizComplete(score: number, total: number) {
    setQuizScore({ score, total });
    setQuizCompleted(true);
  }

  if (loading) {
    return <div className="text-center py-20 text-slate-400">جاري التحميل...</div>;
  }

  if (!course || !lesson) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-slate-300">الدرس غير موجود</h2>
        <button onClick={() => navigate('/levels')} className="mt-4 text-blue-400">العودة</button>
      </div>
    );
  }

  const { prev, next } = getPrevNextLesson();

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/levels/${courseId}`)} className="text-slate-400 hover:text-slate-200 text-xl">→</button>
        <div className="flex-1">
          <span className="text-xs text-slate-500">{course.title}</span>
          <h2 className="text-lg font-bold text-slate-100">{lesson.title}</h2>
        </div>
      </div>

      {/* Objectives */}
      {lesson.objectives && lesson.objectives.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
          <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
            <span>🎯</span> الأهداف التعليمية
          </h3>
          <ul className="space-y-1">
            {lesson.objectives.map((obj, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content Blocks */}
      <div>
        {lesson.contentBlocks?.map((block, i) => (
          <ContentBlockRenderer key={i} block={block} />
        ))}
      </div>

      {/* Examples */}
      {lesson.examples && lesson.examples.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
            <span>📋</span> أمثلة
          </h3>
          {lesson.examples.map((block, i) => (
            <ContentBlockRenderer key={i} block={block} />
          ))}
        </div>
      )}

      {/* Exercises */}
      {lesson.exercises && lesson.exercises.length > 0 && (
        <ExerciseSection exercises={lesson.exercises} />
      )}

      {/* Quiz */}
      {lesson.quiz && lesson.quiz.length > 0 && (
        <QuizSection quiz={lesson.quiz} onComplete={handleQuizComplete} />
      )}

      {/* Complete & Navigation */}
      <div className="space-y-3 pt-4 border-t border-slate-700/50">
        <button
          onClick={handleCompleteLesson}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
        >
          ✅ إكمال الدرس
        </button>
        
        <div className="flex gap-3">
          {prev && (
            <button
              onClick={() => navigate(`/lesson/${courseId}/${prev.id}`)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 rounded-xl transition-all text-sm"
            >
              → الدرس السابق
            </button>
          )}
          {next && (
            <button
              onClick={() => navigate(`/lesson/${courseId}/${next.id}`)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 rounded-xl transition-all text-sm"
            >
              الدرس التالي ←
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
