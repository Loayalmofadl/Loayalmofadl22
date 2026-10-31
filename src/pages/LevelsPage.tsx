import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCourses, getProgress, Course, UserProgress } from '../utils/database';

export default function LevelsPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const coursesData = await getAllCourses();
      setCourses(coursesData);
      
      const pMap: Record<string, UserProgress> = {};
      for (const course of coursesData) {
        const p = await getProgress(course.id);
        if (p) pMap[course.id] = p;
      }
      setProgressMap(pMap);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function getCourseProgress(course: Course): { completed: number; total: number; percent: number } {
    const progress = progressMap[course.id];
    let total = 0;
    course.units.forEach(u => { total += u.lessons.length; });
    const completed = progress ? progress.completedLessons.length : 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  if (loading) {
    return <div className="text-center py-20 text-slate-400">جاري التحميل...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📭</div>
        <h2 className="text-xl font-bold text-slate-300 mb-2">لا توجد مستويات</h2>
        <p className="text-slate-400 mb-6">قم بإضافة منهج تعليمي من صفحة إدارة المناهج</p>
        <button
          onClick={() => navigate('/manage')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
        >
          ⚙️ إدارة المناهج
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-100">المستويات</h2>
        <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          {courses.length} مستوى
        </span>
      </div>

      {courses.map(course => {
        const prog = getCourseProgress(course);
        const isComplete = prog.percent === 100;
        
        return (
          <button
            key={course.id}
            onClick={() => navigate(`/levels/${course.id}`)}
            className="w-full text-right bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/50 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    المستوى {course.levelNumber}
                  </span>
                  {isComplete && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      ✅ مكتمل
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{course.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{course.description}</p>
              </div>
              <span className="text-2xl">{isComplete ? '🏆' : '📘'}</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <span>{course.units.length} وحدة</span>
              <span>{prog.total} درس</span>
              <span>~{course.estimatedMinutes} دقيقة</span>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${prog.percent}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 mt-1">{prog.percent}% مكتمل</div>
          </button>
        );
      })}
    </div>
  );
}
