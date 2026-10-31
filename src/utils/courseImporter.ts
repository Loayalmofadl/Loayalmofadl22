// Course Importer - Validates and imports course JSON files
import { Course, saveCourse, getCourse } from './database';

const SUPPORTED_SCHEMA_VERSIONS = ['1.0'];

export interface ValidationError {
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  errors: ValidationError[];
  warnings: string[];
  course?: Course;
  preview?: {
    title: string;
    unitsCount: number;
    lessonsCount: number;
    estimatedMinutes: number;
  };
}

export function validateCourseJSON(data: unknown): ImportResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'root', message: 'الملف لا يحتوي على بيانات JSON صالحة' });
    return { success: false, errors, warnings };
  }
  
  const course = data as Record<string, unknown>;
  
  // Required fields validation
  const requiredFields = ['id', 'title', 'description', 'levelNumber', 'order', 'language', 'schemaVersion', 'units'];
  requiredFields.forEach(field => {
    if (!(field in course)) {
      errors.push({ field, message: `الحقل "${field}" مطلوب` });
    }
  });
  
  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }
  
  // Schema version check
  const schemaVersion = course.schemaVersion as string;
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion)) {
    errors.push({ field: 'schemaVersion', message: `إصدار المخطط "${schemaVersion}" غير مدعوم. الإصدارات المدعومة: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}` });
    return { success: false, errors, warnings };
  }
  
  // Type validations
  if (typeof course.id !== 'string' || course.id.trim() === '') {
    errors.push({ field: 'id', message: 'معرف المستوى يجب أن يكون نصاً غير فارغ' });
  }
  
  if (typeof course.title !== 'string' || course.title.trim() === '') {
    errors.push({ field: 'title', message: 'عنوان المستوى يجب أن يكون نصاً غير فارغ' });
  }
  
  if (typeof course.levelNumber !== 'number' || course.levelNumber < 1) {
    errors.push({ field: 'levelNumber', message: 'رقم المستوى يجب أن يكون رقماً موجباً' });
  }
  
  if (typeof course.order !== 'number') {
    errors.push({ field: 'order', message: 'ترتيب المستوى يجب أن يكون رقماً' });
  }
  
  // Units validation
  if (!Array.isArray(course.units)) {
    errors.push({ field: 'units', message: 'الوحدات يجب أن تكون مصفوفة' });
    return { success: false, errors, warnings };
  }
  
  if (course.units.length === 0) {
    warnings.push('المستوى لا يحتوي على وحدات');
  }
  
  let totalLessons = 0;
  
  (course.units as Record<string, unknown>[]).forEach((unit, unitIdx) => {
    const unitPrefix = `units[${unitIdx}]`;
    
    if (!unit.id || typeof unit.id !== 'string') {
      errors.push({ field: `${unitPrefix}.id`, message: 'معرف الوحدة مطلوب' });
    }
    
    if (!unit.title || typeof unit.title !== 'string') {
      errors.push({ field: `${unitPrefix}.title`, message: 'عنوان الوحدة مطلوب' });
    }
    
    if (!Array.isArray(unit.lessons)) {
      errors.push({ field: `${unitPrefix}.lessons`, message: 'الدروس يجب أن تكون مصفوفة' });
      return;
    }
    
    (unit.lessons as Record<string, unknown>[]).forEach((lesson, lessonIdx) => {
      const lessonPrefix = `${unitPrefix}.lessons[${lessonIdx}]`;
      totalLessons++;
      
      if (!lesson.id || typeof lesson.id !== 'string') {
        errors.push({ field: `${lessonPrefix}.id`, message: 'معرف الدرس مطلوب' });
      }
      
      if (!lesson.title || typeof lesson.title !== 'string') {
        errors.push({ field: `${lessonPrefix}.title`, message: 'عنوان الدرس مطلوب' });
      }
      
      // Validate content blocks
      if (lesson.contentBlocks && Array.isArray(lesson.contentBlocks)) {
        const validTypes = ['paragraph', 'heading', 'list', 'code', 'note', 'warning', 'image'];
        (lesson.contentBlocks as Record<string, unknown>[]).forEach((block, blockIdx) => {
          if (!validTypes.includes(block.type as string)) {
            errors.push({ field: `${lessonPrefix}.contentBlocks[${blockIdx}].type`, message: `نوع المحتوى "${block.type}" غير صالح` });
          }
        });
      }
      
      // Validate quiz
      if (lesson.quiz && Array.isArray(lesson.quiz)) {
        (lesson.quiz as Record<string, unknown>[]).forEach((q, qIdx) => {
          const qPrefix = `${lessonPrefix}.quiz[${qIdx}]`;
          if (!q.question || typeof q.question !== 'string') {
            errors.push({ field: `${qPrefix}.question`, message: 'نص السؤال مطلوب' });
          }
          if (!Array.isArray(q.options) || (q.options as unknown[]).length < 2) {
            errors.push({ field: `${qPrefix}.options`, message: 'الخيارات يجب أن تكون مصفوفة تحتوي على خيارين على الأقل' });
          }
          if (typeof q.correctAnswer !== 'number') {
            errors.push({ field: `${qPrefix}.correctAnswer`, message: 'الإجابة الصحيحة مطلوبة' });
          }
        });
      }
    });
  });
  
  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }
  
  const courseObj = course as unknown as Course;
  
  return {
    success: true,
    errors: [],
    warnings,
    course: courseObj,
    preview: {
      title: courseObj.title,
      unitsCount: courseObj.units.length,
      lessonsCount: totalLessons,
      estimatedMinutes: courseObj.estimatedMinutes || 0
    }
  };
}

export async function importCourse(fileContent: string): Promise<ImportResult> {
  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(fileContent);
  } catch {
    return {
      success: false,
      errors: [{ field: 'json', message: 'الملف لا يحتوي على JSON صالح' }],
      warnings: []
    };
  }
  
  // Validate
  const result = validateCourseJSON(data);
  if (!result.success) {
    return result;
  }
  
  // Check for duplicates
  const existingCourse = await getCourse(result.course!.id);
  if (existingCourse) {
    result.warnings.push(`يوجد مستوى بنفس المعرف "${result.course!.id}". سيتم تحديثه مع الحفاظ على التقدم.`);
  }
  
  // Add import timestamp
  result.course!.importedAt = Date.now();
  
  // Save to database
  await saveCourse(result.course!);
  
  return result;
}

export async function exportCourse(courseId: string): Promise<string | null> {
  const course = await getCourse(courseId);
  if (!course) return null;
  
  // Remove importedAt for clean export
  const { importedAt, ...exportData } = course;
  return JSON.stringify(exportData, null, 2);
}

export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
