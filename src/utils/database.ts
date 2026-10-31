// Database module - IndexedDB operations for courses and progress

const DB_NAME = 'menssa_platform';
const DB_VERSION = 1;

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'note' | 'warning' | 'image';
  content?: string;
  items?: string[];
  language?: string;
  src?: string;
  alt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  requirement: string;
  hint?: string;
  solution?: string;
}

export interface Lesson {
  id: string;
  title: string;
  objectives: string[];
  order: number;
  contentBlocks: ContentBlock[];
  examples?: ContentBlock[];
  exercises?: Exercise[];
  quiz?: QuizQuestion[];
}

export interface Unit {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  levelNumber: number;
  order: number;
  language: string;
  schemaVersion: string;
  estimatedMinutes: number;
  units: Unit[];
  importedAt: number;
}

export interface LessonProgress {
  lessonId: string;
  courseId: string;
  completed: boolean;
  completedAt?: number;
  quizScore?: number;
  quizTotal?: number;
  lastAccessed?: number;
}

export interface UserProgress {
  courseId: string;
  completedLessons: string[];
  quizResults: { lessonId: string; score: number; total: number; date: number }[];
  lastActivity: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('courses')) {
        db.createObjectStore('courses', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('progress')) {
        const progressStore = db.createObjectStore('progress', { keyPath: 'courseId' });
        progressStore.createIndex('lastActivity', 'lastActivity');
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Course operations
export async function saveCourse(course: Course): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('courses', 'readwrite');
    const store = tx.objectStore('courses');
    store.put(course);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getCourse(id: string): Promise<Course | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('courses', 'readonly');
    const store = tx.objectStore('courses');
    const request = store.get(id);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getAllCourses(): Promise<Course[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('courses', 'readonly');
    const store = tx.objectStore('courses');
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      const courses = request.result.sort((a: Course, b: Course) => a.order - b.order);
      resolve(courses);
    };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function deleteCourse(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('courses', 'readwrite');
    const store = tx.objectStore('courses');
    store.delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// Progress operations
export async function saveProgress(progress: UserProgress): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readwrite');
    const store = tx.objectStore('progress');
    store.put(progress);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getProgress(courseId: string): Promise<UserProgress | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readonly');
    const store = tx.objectStore('progress');
    const request = store.get(courseId);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getAllProgress(): Promise<UserProgress[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readonly');
    const store = tx.objectStore('progress');
    const request = store.getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function deleteProgress(courseId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readwrite');
    const store = tx.objectStore('progress');
    store.delete(courseId);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function markLessonComplete(courseId: string, lessonId: string, quizScore?: number, quizTotal?: number): Promise<void> {
  let progress = await getProgress(courseId);
  if (!progress) {
    progress = {
      courseId,
      completedLessons: [],
      quizResults: [],
      lastActivity: Date.now()
    };
  }
  
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
  }
  
  if (quizScore !== undefined && quizTotal !== undefined) {
    const existingIdx = progress.quizResults.findIndex(q => q.lessonId === lessonId);
    if (existingIdx >= 0) {
      progress.quizResults[existingIdx] = { lessonId, score: quizScore, total: quizTotal, date: Date.now() };
    } else {
      progress.quizResults.push({ lessonId, score: quizScore, total: quizTotal, date: Date.now() });
    }
  }
  
  progress.lastActivity = Date.now();
  await saveProgress(progress);
}

export async function getOverallStats() {
  const courses = await getAllCourses();
  const allProgress = await getAllProgress();
  
  let totalLessons = 0;
  let completedLessons = 0;
  
  courses.forEach(course => {
    course.units.forEach(unit => {
      totalLessons += unit.lessons.length;
    });
  });
  
  allProgress.forEach(p => {
    completedLessons += p.completedLessons.length;
  });
  
  const lastActivity = allProgress.length > 0 
    ? Math.max(...allProgress.map(p => p.lastActivity))
    : 0;
  
  return {
    totalCourses: courses.length,
    totalLessons,
    completedLessons,
    lastActivity
  };
}
