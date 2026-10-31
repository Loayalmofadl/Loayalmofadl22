import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOverallStats, getAllCourses, Course } from '../utils/database';

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalCourses: 0, totalLessons: 0, completedLessons: 0, lastActivity: 0 });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, coursesData] = await Promise.all([getOverallStats(), getAllCourses()]);
      setStats(statsData);
      setCourses(coursesData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const progressPercent = stats.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100) 
    : 0;

  const lastActivityText = stats.lastActivity > 0
    ? new Date(stats.lastActivity).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'لا يوجد نشاط بعد';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <div className="text-5xl mb-4">📖</div>
        <h1 className="text-3xl font-bold text-blue-400 mb-2">مِنصّة</h1>
        <p className="text-slate-400 text-lg">تعلّم البرمجة باللغة العربية</p>
        <p className="text-slate-500 text-sm mt-2">منصة تعليمية تعمل دون إنترنت</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-3xl font-bold text-blue-400">{stats.totalCourses}</div>
          <div className="text-sm text-slate-400 mt-1">المستويات المتاحة</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-3xl font-bold text-green-400">{stats.completedLessons}</div>
          <div className="text-sm text-slate-400 mt-1">دروس مكتملة</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-3xl font-bold text-purple-400">{stats.totalLessons}</div>
          <div className="text-sm text-slate-400 mt-1">إجمالي الدروس</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-3xl font-bold text-amber-400">{progressPercent}%</div>
          <div className="text-sm text-slate-400 mt-1">نسبة التقدم</div>
        </div>
      </div>

      {/* Progress Bar */}
      {stats.totalLessons > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-300">التقدم العام</span>
            <span className="text-sm text-blue-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-l from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Last Activity */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕐</span>
          <div>
            <div className="text-sm text-slate-400">آخر نشاط تعليمي</div>
            <div className="text-slate-200">{lastActivityText}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {courses.length > 0 ? (
        <div className="space-y-3">
          <button
            onClick={() => navigate('/levels')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
          >
            📚 متابعة التعلم
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
          >
            📊 عرض التقدم
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد مناهج حالياً</h3>
            <p className="text-slate-400 text-sm mb-4">
              ابدأ بإضافة منهج تعليمي من صفحة إدارة المناهج
            </p>
            <button
              onClick={() => navigate('/manage')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
            >
              ⚙️ إدارة المناهج
            </button>
          </div>
        </div>
      )}

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Offline Notice */}
      <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 text-center">
        <p className="text-green-400 text-sm">✅ هذه المنصة تعمل دون إنترنت بعد التثبيت</p>
      </div>

      {/* Install Instructions */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
        <h3 className="text-sm font-bold text-slate-300 mb-2">📱 تثبيت التطبيق على Android</h3>
        <ol className="space-y-1 text-xs text-slate-400 list-decimal list-inside">
          <li>افتح المنصة في متصفح Chrome</li>
          <li>اضغط على القائمة (⋮) في أعلى المتصفح</li>
          <li>اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"</li>
          <li>سيظهر التطبيق كأيقونة مستقلة على شاشتك</li>
        </ol>
      </div>
    </div>
  );
}

function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  if (!showPrompt) return null;

  return (
    <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📲</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-300">ثبّت التطبيق</p>
          <p className="text-xs text-slate-400">استخدم المنصة كتطبيق مستقل دون إنترنت</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          تثبيت
        </button>
      </div>
    </div>
  );
}
