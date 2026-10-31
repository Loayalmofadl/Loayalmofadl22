import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getProgress, Course, UserProgress } from '../utils/database';

export default function LevelDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [courseId]);

  async function loadData() {
    if (!courseId) return;
    try {
      const [courseData, progressData] = await Promise.all([
        getCourse(courseId),
        getProgress(courseId)
      ]);
      if (courseData) setCourse(courseData);
      if (progressData) setProgress(progressData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function isLessonComplete(lessonId: string): boolean {
    return progress?.completedLessons.includes(lessonId) || false;
  }

  function getQuizScore(lessonId: string): { score: number; total: number } | null {
    const result = progress?.quizResults.find(q => q.lessonId === lessonId);
    return result ? { score: result.score, total: result.total } : null;
  }

  function getAllLessons() {
    if (!course) return [];
    const lessons: { lesson: typeof course.units[0]['lessons'][0]; unitTitle: string; globalIndex: number }[] = [];
    let idx = 0;
    course.units.forEach(unit => {
      unit.lessons.forEach(lesson => {
        lessons.push({ lesson, unitTitle: unit.title, globalIndex: idx });
        idx++;
      });
    });
    return lessons;
  }

  function findNextIncompleteLesson(): string | null {
    const allLessons = getAllLessons();
    for (const { lesson } of allLessons) {
      if (!isLessonComplete(lesson.id)) return lesson.id;
    }
    return null;
  }

  if (loading) {
    return <div className="text-center py-20 text-slate-400">جاري التحميل...</div>;
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-slate-300">المستوى غير موجود</h2>
        <button onClick={() => navigate('/levels')} className="mt-4 text-blue-400">العودة للمستويات</button>
      </div>
    );
  }

  const allLessons = getAllLessons();
  const nextLesson = findNextIncompleteLesson();
  const completedCount = progress?.completedLessons.length || 0;
  const totalCount = allLessons.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/levels')} className="text-slate-400 hover:text-slate-200 text-xl">→</button>
        <div>
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">المستوى {course.levelNumber}</span>
          <h2 className="text-xl font-bold text-slate-100 mt-1">{course.title}</h2>
          <p className="text-sm text-slate-400">{course.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-300">التقدم</span>
          <span className="text-sm text-blue-400 font-bold">{completedCount}/{totalCount} درس ({percent}%)</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
        </div>
      </div>

      {/* Continue Button */}
      {nextLesson && (
        <button
          onClick={() => navigate(`/lesson/${courseId}/${nextLesson}`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
        >
          ▶️ متابعة التعلم
        </button>
      )}

      {/* Units and Lessons */}
      {course.units.map((unit, unitIdx) => (
        <div key={unit.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 bg-slate-800 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                الوحدة {unitIdx + 1}
              </span>
              <h3 className="font-bold text-slate-100">{unit.title}</h3>
            </div>
            {unit.description && <p className="text-sm text-slate-400 mt-1">{unit.description}</p>}
          </div>
          
          <div className="divide-y divide-slate-700/30">
            {unit.lessons
              .sort((a, b) => a.order - b.order)
              .map((lesson) => {
                const complete = isLessonComplete(lesson.id);
                const quizResult = getQuizScore(lesson.id);
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(`/lesson/${courseId}/${lesson.id}`)}
                    className="w-full text-right p-4 hover:bg-slate-700/30 transition-all flex items-center gap-3"
                  >
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      complete ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {complete ? '✓' : lesson.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${complete ? 'text-slate-300' : 'text-slate-100'}`}>
                        {lesson.title}
                      </div>
                      {quizResult && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          نتيجة الاختبار: {quizResult.score}/{quizResult.total}
                        </div>
                      )}
                    </div>
                    <span className="text-slate-500 text-sm">←</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
