import { useState, useEffect, useRef } from 'react';
import { getAllCourses, deleteCourse, deleteProgress, Course } from '../utils/database';
import { importCourse, exportCourse, downloadJSON, validateCourseJSON, ImportResult } from '../utils/courseImporter';

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const data = await getAllCourses();
      setCourses(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPendingFileContent(content);
      
      // Validate first
      try {
        const data = JSON.parse(content);
        const result = validateCourseJSON(data);
        setImportResult(result);
        if (result.success) {
          setShowConfirmImport(true);
        }
      } catch {
        setImportResult({
          success: false,
          errors: [{ field: 'json', message: 'الملف لا يحتوي على JSON صالح' }],
          warnings: []
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function confirmImport() {
    if (!pendingFileContent) return;
    
    try {
      const result = await importCourse(pendingFileContent);
      if (result.success) {
        showMessage('success', `تم استيراد "${result.preview?.title}" بنجاح!`);
        await loadCourses();
      } else {
        showMessage('error', `فشل الاستيراد: ${result.errors.map(e => e.message).join(', ')}`);
      }
    } catch (e) {
      showMessage('error', 'حدث خطأ أثناء الاستيراد');
    }
    
    setShowConfirmImport(false);
    setImportResult(null);
    setPendingFileContent(null);
  }

  async function handleExport(courseId: string) {
    try {
      const json = await exportCourse(courseId);
      if (json) {
        const course = courses.find(c => c.id === courseId);
        downloadJSON(json, `${courseId}.json`);
        showMessage('success', 'تم تصدير المنهج بنجاح');
      }
    } catch (e) {
      showMessage('error', 'فشل التصدير');
    }
  }

  async function handleDelete(courseId: string) {
    try {
      await deleteCourse(courseId);
      await deleteProgress(courseId);
      showMessage('success', 'تم حذف المنهج');
      await loadCourses();
    } catch (e) {
      showMessage('error', 'فشل الحذف');
    }
    setDeleteConfirm(null);
  }

  function getTotalLessons(course: Course): number {
    let count = 0;
    course.units.forEach(u => { count += u.lessons.length; });
    return count;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">إدارة المناهج</h2>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-900/20 border-green-700/30 text-green-400' 
            : 'bg-red-900/20 border-red-700/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Import Section */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
          <span>📥</span> استيراد منهج
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          اختر ملف JSON يحتوي على منهج تعليمي. سيتم التحقق من صحته قبل الاستيراد.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
          id="course-file-input"
        />
        <label
          htmlFor="course-file-input"
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all cursor-pointer active:scale-95"
        >
          📁 اختر ملف JSON
        </label>
      </div>

      {/* Import Preview / Confirmation */}
      {showConfirmImport && importResult?.success && importResult.preview && (
        <div className="bg-blue-900/20 rounded-xl p-5 border border-blue-700/30">
          <h3 className="text-lg font-bold text-blue-400 mb-3">معاينة المنهج</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <div>📚 العنوان: <strong>{importResult.preview.title}</strong></div>
            <div>📦 الوحدات: <strong>{importResult.preview.unitsCount}</strong></div>
            <div>📝 الدروس: <strong>{importResult.preview.lessonsCount}</strong></div>
            <div>⏱️ المدة التقديرية: <strong>{importResult.preview.estimatedMinutes} دقيقة</strong></div>
          </div>
          {importResult.warnings.length > 0 && (
            <div className="mt-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
              {importResult.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-400">⚠️ {w}</p>
              ))}
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={confirmImport}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              ✅ تأكيد الاستيراد
            </button>
            <button
              onClick={() => { setShowConfirmImport(false); setImportResult(null); setPendingFileContent(null); }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl transition-all"
            >
              ❌ إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {importResult && !importResult.success && !showConfirmImport && (
        <div className="bg-red-900/20 rounded-xl p-5 border border-red-700/30">
          <h3 className="text-lg font-bold text-red-400 mb-3">❌ أخطاء في الملف</h3>
          <div className="space-y-2">
            {importResult.errors.map((err, i) => (
              <div key={i} className="text-sm text-red-300 bg-red-900/20 rounded-lg p-2">
                <span className="text-red-400 font-mono text-xs">{err.field}:</span> {err.message}
              </div>
            ))}
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="mt-4 text-sm text-slate-400 hover:text-slate-200"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Courses List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-200">المناهج المستوردة ({courses.length})</h3>
        
        {courses.length === 0 ? (
          <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400">لا توجد مناهج مستوردة حالياً</p>
            <p className="text-slate-500 text-sm mt-1">استخدم زر الاستيراد أعلاه لإضافة منهج</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                className="w-full text-right p-4 hover:bg-slate-700/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200">{course.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>المستوى {course.levelNumber}</span>
                      <span>{course.units.length} وحدة</span>
                      <span>{getTotalLessons(course)} درس</span>
                    </div>
                  </div>
                  <span className="text-slate-400">{expandedCourse === course.id ? '▲' : '▼'}</span>
                </div>
              </button>
              
              {expandedCourse === course.id && (
                <div className="p-4 pt-0 border-t border-slate-700/30">
                  <p className="text-sm text-slate-400 mb-3">{course.description}</p>
                  
                  {/* Units Preview */}
                  <div className="space-y-2 mb-4">
                    {course.units.map(unit => (
                      <div key={unit.id} className="bg-slate-700/30 rounded-lg p-3">
                        <div className="text-sm font-medium text-slate-300">{unit.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{unit.lessons.length} درس</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(course.id)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-2 rounded-lg transition-all"
                    >
                      📤 تصدير
                    </button>
                    {deleteConfirm === course.id ? (
                      <div className="flex-1 flex gap-2">
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition-all"
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-2 rounded-lg transition-all"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(course.id)}
                        className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-medium py-2 rounded-lg transition-all border border-red-700/30"
                      >
                        🗑️ حذف
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-slate-600">
                    المعرف: {course.id} | الإصدار: {course.schemaVersion} | 
                    تاريخ الاستيراد: {new Date(course.importedAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Help Section */}
      <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/30">
        <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
          <span>📖</span> كيفية إضافة منهج جديد
        </h3>
        <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
          <li>أنشئ ملف JSON وفق صيغة المنهج المحددة</li>
          <li>تأكد من وجود جميع الحقول المطلوبة</li>
          <li>اضغط على "اختر ملف JSON" أعلاه</li>
          <li>راجع المعاينة ثم أكد الاستيراد</li>
          <li>سيظهر المنهج تلقائياً في قائمة المستويات</li>
        </ol>
        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
          <p className="text-xs text-slate-500">
            📌 الإصدار المدعوم من صيغة المناهج: <span className="text-blue-400">1.0</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            📌 راجع ملف <span className="text-blue-400">COURSE_FORMAT.md</span> للتفاصيل الكاملة
          </p>
        </div>
      </div>
    </div>
  );
}
