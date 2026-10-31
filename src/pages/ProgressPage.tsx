import { useState, useEffect } from 'react';
import { getAllCourses, getAllProgress, Course, UserProgress } from '../utils/database';

export default function ProgressPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [coursesData, progressData] = await Promise.all([getAllCourses(), getAllProgress()]);
      setCourses(coursesData);
      setProgressList(progressData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function getCourseStats(course: Course) {
    const progress = progressList.find(p => p.courseId === course.id);
    let totalLessons = 0;
    course.units.forEach(u => { totalLessons += u.lessons.length; });
    const completed = progress ? progress.completedLessons.length : 0;
    const percent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    return { totalLessons, completed, percent, quizResults: progress?.quizResults || [] };
  }

  const totalCompleted = progressList.reduce((sum, p) => sum + p.completedLessons.length, 0);
  const totalLessons = courses.reduce((sum, c) => {
    let count = 0;
    c.units.forEach(u => { count += u.lessons.length; });
    return sum + count;
  }, 0);
  const overallPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const lastActivity = progressList.length > 0
    ? Math.max(...progressList.map(p => p.lastActivity))
    : 0;

  if (loading) {
    return <div className="text-center py-20 text-slate-400">جاري التحميل...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-xl font-bold text-slate-300 mb-2">لا توجد بيانات تقدم</h2>
        <p className="text-slate-400">ابدأ بإضافة منهج ثم ادرس الدروس</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">التقدم</h2>

      {/* Overall Stats */}
      <div className="bg-gradient-to-l from-blue-900/30 to-purple-900/30 rounded-xl p-5 border border-blue-700/30">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-400">{overallPercent}%</div>
          <div className="text-sm text-slate-400 mt-1">التقدم العام</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-200">{totalCompleted}</div>
            <div className="text-xs text-slate-400">مكتمل</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-200">{totalLessons}</div>
            <div className="text-xs text-slate-400">إجمالي</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-200">{courses.length}</div>
            <div className="text-xs text-slate-400">مستويات</div>
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕐</span>
          <div>
            <div className="text-sm text-slate-400">آخر نشاط</div>
            <div className="text-slate-200">
              {lastActivity > 0 
                ? new Date(lastActivity).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'لا يوجد نشاط'}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Course Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-200">تفاصيل المستويات</h3>
        
        {courses.map(course => {
          const stats = getCourseStats(course);
          
          return (
            <div key={course.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-200">{course.title}</h4>
                <span className={`text-sm font-bold ${stats.percent === 100 ? 'text-green-400' : 'text-blue-400'}`}>
                  {stats.percent}%
                </span>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full ${stats.percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${stats.percent}%` }}
                ></div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{stats.completed}/{stats.totalLessons} درس مكتمل</span>
                {stats.quizResults.length > 0 && (
                  <span>📝 {stats.quizResults.length} اختبار</span>
                )}
              </div>

              {/* Quiz Results */}
              {stats.quizResults.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-2">نتائج الاختبارات:</div>
                  <div className="flex flex-wrap gap-2">
                    {stats.quizResults.map((qr, i) => (
                      <span key={i} className={`text-xs px-2 py-1 rounded-full ${
                        qr.score >= qr.total / 2 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {qr.score}/{qr.total}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
