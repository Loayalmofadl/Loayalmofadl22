import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LevelsPage from './pages/LevelsPage';
import LevelDetailPage from './pages/LevelDetailPage';
import LessonPage from './pages/LessonPage';
import ProgressPage from './pages/ProgressPage';
import ManageCoursesPage from './pages/ManageCoursesPage';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'الرئيسية', icon: '🏠' },
    { path: '/levels', label: 'المستويات', icon: '📚' },
    { path: '/progress', label: 'التقدم', icon: '📊' },
    { path: '/manage', label: 'المناهج', icon: '⚙️' },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <h1 className="text-lg font-bold text-blue-400">مِنصّة</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
          <span className="text-xs text-slate-400">{isOnline ? 'متصل' : 'غير متصل'}</span>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50">
        <div className="flex justify-around items-center py-2">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                location.pathname === item.path 
                  ? 'text-blue-400 bg-blue-400/10' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-900 text-slate-200">
        <NavBar />
        <main className="pt-14 pb-16 px-4 max-w-2xl mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/levels" element={<LevelsPage />} />
            <Route path="/levels/:courseId" element={<LevelDetailPage />} />
            <Route path="/lesson/:courseId/:lessonId" element={<LessonPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/manage" element={<ManageCoursesPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
