'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // GÜNCELLENDİ: useSearchParams eklendi
import { supabase } from '@/lib/supabaseClient';
import { StudentExamInput, ExamType } from '@/lib/examEngine/types';
import { generateDoorListHTML, generateAttendanceListHTML, generateFinalReportHTML } from '@/components/print/PrintTemplates';

interface Profile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'teacher';
}

interface Exam {
  id: number;
  name: string;
  attendance_locked?: boolean;
}

interface Student {
  id: string;
  name: string;
  writing_score: number | null;
  speaking_score: number | null;
  status: string;
  raw_scores?: any;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams(); // EKLENDİ: URL parametrelerini okuma motoru
  const examIdParam = searchParams.get('examId'); // EKLENDİ: URL'deki ?examId= değerini yakalar

  // Authentication & Session States
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  // Design Consistent Validation Error States
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);
  const [studentValidationError, setStudentValidationError] = useState<string | null>(null);
  const [examValidationError, setExamValidationError] = useState<string | null>(null);

  // Global Content States
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Exam Generation Sequence States
  const [buildType, setBuildType] = useState<string>('');
  const [buildYear, setBuildYear] = useState<string>('');
  const [buildMonth, setBuildMonth] = useState<string>('');

  // Candidate Registration Interface States
  const [studentInput, setStudentInput] = useState<string>('');
  const [pendingStudents, setPendingStudents] = useState<string[]>([]);
  const [targetExamId, setTargetExamId] = useState<string>('');
  const [existingStudentsInTarget, setExistingStudentsInTarget] = useState<string[]>([]);

  // Destructive Action Modal Control State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'exam' | 'student';
    id: number | string;
    name: string;
  } | null>(null);

  // UI Status Flag Identifiers
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dynamic Time Engine Constants
  const currentYear = new Date().getFullYear();
  const availableYears = [String(currentYear), String(currentYear + 1)];
  const allMonths = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleEmailBlur = () => {
    if (email.length === 0) {
      setEmailValidationError(null);
      return;
    }
    const corporateEmailPattern = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\@scaleflow\.com$/;
    if (!corporateEmailPattern.test(email)) {
      setEmailValidationError('Please follow this structure: your username.institution@scaleflow.com');
    } else {
      setEmailValidationError(null);
    }
  };

  const handleEmailFocus = () => setEmailValidationError(null);

  // Optimized Unified Print Orchestrators
  const executePrint = (htmlContent: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const printDoorList = () => {
    const currentExam = allExams.find(e => String(e.id) === selectedExamId); // Küçük düzeltme: undefined hatasını önlemek için güvenli tanım
    if (!currentExam) return;
    const html = generateDoorListHTML({ examName: currentExam.name, students: activeStudents });
    executePrint(html);
  };

  const printAttendanceList = () => {
    const currentExam = allExams.find(e => String(e.id) === selectedExamId); // Küçük düzeltme
    if (!currentExam) return;
    const html = generateAttendanceListHTML({ examName: currentExam.name, students: activeStudents });
    executePrint(html);
  };

  // EKLENDİ: URL köprüsünü kuran hayati gözcü. Geri butonuna basıldığında tetiklenir.
  useEffect(() => {
    if (examIdParam) {
      setSelectedExamId(examIdParam);
    }
  }, [examIdParam]);

  // Asynchronously fetch existing student ledger names whenever target exam changes
  useEffect(() => {
    if (!targetExamId) {
      setExistingStudentsInTarget([]);
      return;
    }
    async function loadTargetRosterNames() {
      const { data } = await supabase
        .from('students')
        .select('name')
        .eq('exam_id', Number(targetExamId));
      if (data) {
        setExistingStudentsInTarget(data.map(s => s.name.trim().toLowerCase()));
      }
    }
    loadTargetRosterNames();
  }, [targetExamId]);

  // Reactive Validation Engine for Exam Generation Duplicates
  useEffect(() => {
    if (!buildType || !buildYear || !buildMonth) {
      setExamValidationError(null);
      return;
    }
    const concatenatedName = `${buildType} ${buildYear} ${buildMonth}`.trim().toLowerCase();
    const isDuplicate = allExams.some(exam => exam.name.trim().toLowerCase() === concatenatedName);
    if (isDuplicate) {
      setExamValidationError('An active exam session with this configuration already exists.');
    } else {
      setExamValidationError(null);
    }
  }, [buildType, buildYear, buildMonth, allExams]);

  // Unified Reactive Validation Engine for Candidate Input
  useEffect(() => {
    const trimmed = studentInput.trim().toLowerCase();
    if (!trimmed) {
      setStudentValidationError(null);
      return;
    }
    const isDuplicateInQueue = pendingStudents.some(name => name.toLowerCase() === trimmed);
    const isDuplicateInDatabase = existingStudentsInTarget.includes(trimmed);

    if (isDuplicateInQueue) {
      setStudentValidationError('Candidate already exists in the registry queue.');
    } else if (isDuplicateInDatabase) {
      setStudentValidationError('Candidate already registered in this specific session.');
    } else {
      setStudentValidationError(null);
    }
  }, [studentInput, pendingStudents, existingStudentsInTarget]);

  // Unified Live Authentication Lifecycle Listener
  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, email, role')
          .eq('email', session.user.email!)
          .maybeSingle();

        if (profileData) {
          setCurrentProfile(profileData as Profile);
          setAuthError(null);
          const { data: exams } = await supabase.from('exams').select('id, name, attendance_locked').order('id', { ascending: false });
          if (exams) setAllExams(exams);
        } else {
          setAuthError('Profile record missing in cloud workspace ledger.');
          setCurrentProfile(null);
        }
      } else {
        setSessionUser(null);
        setCurrentProfile(null);
        setSelectedExamId(null);
        setAllExams([]);
        setActiveStudents([]);
        setAuthError(null);
      }
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Syncs candidate lists reactively whenever a target exam context is loaded
  useEffect(() => {
    if (!selectedExamId) {
      setActiveStudents([]);
      return;
    }
    async function fetchStudents() {
      setIsLoading(true);
      const { data } = await supabase
        .from('students')
        .select('id, name, writing_score, speaking_score, status, raw_scores')
        .eq('exam_id', selectedExamId)
        .order('name', { ascending: true });
      if (data) setActiveStudents(data as Student[]);
      setIsLoading(false);
    }
    fetchStudents();
  }, [selectedExamId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildType || !buildYear || !buildMonth || examValidationError) return;
    const concatenatedName = `${buildType} ${buildYear} ${buildMonth}`;

    setIsSaving(true);
    const { error } = await supabase.from('exams').insert({ name: concatenatedName });
    if (error) {
      showNotification(error.message, 'error');
    } else {
      const { data: exams } = await supabase.from('exams').select('id, name, attendance_locked').order('id', { ascending: false });
      if (exams) setAllExams(exams);
      showNotification(`Session added successfully: ${concatenatedName}`);
      setBuildType('');
      setBuildYear('');
      setBuildMonth('');
    }
    setIsSaving(false);
  };

  const executeConfirmedDeletion = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);

    if (deleteTarget.type === 'exam') {
      const { error } = await supabase.from('exams').delete().eq('id', deleteTarget.id);
      if (error) {
        showNotification(error.message, 'error');
      } else {
        setAllExams(prev => prev.filter(e => e.id !== deleteTarget.id));
        showNotification(`Exam session "${deleteTarget.name}" deleted.`);
      }
    } else if (deleteTarget.type === 'student') {
      const { error } = await supabase.from('students').delete().eq('id', deleteTarget.id);
      if (error) {
        showNotification(error.message, 'error');
      } else {
        setActiveStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
        showNotification(`Candidate "${deleteTarget.name}" removed from session.`);
        if (targetExamId) {
          const { data } = await supabase.from('students').select('name').eq('exam_id', Number(targetExamId));
          if (data) setExistingStudentsInTarget(data.map(s => s.name.trim().toLowerCase()));
        }
      }
    }
    setIsSaving(false);
    setDeleteTarget(null);
  };

  const addStudentToQueue = () => {
    const trimmed = studentInput.trim();
    if (!trimmed || studentValidationError) return;
    setPendingStudents([...pendingStudents, trimmed]);
    setStudentInput('');
  };

  const handleDeployRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentValidationError || !targetExamId) return;

    let finalRoster = [...pendingStudents];
    const directInput = studentInput.trim();
    if (directInput && !finalRoster.includes(directInput)) finalRoster.push(directInput);

    if (finalRoster.length === 0) return;
    setIsSaving(true);

    const payload = finalRoster.map(name => ({ name, exam_id: Number(targetExamId) }));
    const { error } = await supabase.from('students').insert(payload);

    if (error) {
      showNotification(error.message, 'error');
    } else {
      const candidateCount = finalRoster.length;
      setPendingStudents([]);
      setStudentInput('');
      setTargetExamId('');
      setExistingStudentsInTarget([]);
      showNotification(`Registered ${candidateCount} ${candidateCount === 1 ? 'candidate' : 'candidates'} successfully.`);
    }
    setIsSaving(false);
  };

  const markAttendance = async (studentId: string, newStatus: string) => {
    const student = activeStudents.find(s => s.id === studentId);

    if (student && (student.status === 'Partly Graded' || student.status === 'Fully Graded')) {
      // Not: showNotification fonksiyonunu kullanırken nesne gönderme, sadece mesaj gönder.
      return;
    }

    setActiveStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus as any } : s));

    const { error } = await supabase.from('students').update({ status: newStatus }).eq('id', studentId);

    if (error) {
      console.error("DEBUG - Supabase Error Object:", error);
      console.error("DEBUG - Error Message:", error.message); // Hatanın asıl sebebi burada yazacak

      setActiveStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: student?.status as any } : s));
    }
  };

  // 1. Tüm öğrencilerin yoklaması alındı mı?
  const allAttendanceMarked = activeStudents.length > 0 &&
    activeStudents.every(s => s.status === 'Present' || s.status === 'Absent');

  // 2. Mevcut Attendance Sheet butonuna basılınca çalışacak yeni akış
  const handleFinishAttendance = async () => {
    if (!allAttendanceMarked) {
      showNotification('Please mark all candidates as Present or Absent first.', 'error');
      return;
    }

    // 1. Yazdırma
    printAttendanceList();

    // 2. Veritabanını güncelle
    const { error } = await supabase
      .from('exams')
      .update({ attendance_locked: true })
      .eq('id', Number(selectedExamId));

    if (error) {
      showNotification('Error saving attendance: ' + error.message, 'error');
      return;
    }

    // 3. KRİTİK ADIM: Sadece state'i elle güncelleme, veriyi veritabanından tekrar çek
    // Bu sayede tüm sınavlar (ve attendance_locked durumu) senkronize olur.
    const { data: exams, error: fetchError } = await supabase
      .from('exams')
      .select('id, name, attendance_locked')
      .order('id', { ascending: false });

    if (exams) {
      setAllExams(exams);
      showNotification('Attendance sheet saved and locked!', 'success');
    } else {
      showNotification('Attendance locked, but failed to refresh data.', 'error');
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailValidationError) return;
    setIsLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmail('');
    setPassword('');
    setEmailValidationError(null);
    setStudentValidationError(null);
    setExamValidationError(null);
    setBuildType('');
    setBuildYear('');
    setBuildMonth('');
    setTargetExamId('');
  };

  const currentExam = allExams.find(e => String(e.id) === String(selectedExamId));
  const isExamFormIncomplete = !buildType || !buildYear || !buildMonth;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex justify-center selection:bg-indigo-100">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-80 shadow-xl rounded-2xl p-3.5 border text-xs font-bold tracking-tight backdrop-blur-md transition-all flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-100 text-emerald-950' : 'bg-rose-50/95 border-rose-100 text-rose-950'
          }`}>
          <span className="text-sm">{toast.type === 'success' ? '✨' : '⚠️'}</span>
          <div className="flex-1 font-medium">{toast.message}</div>
        </div>
      )}

      {/* Deletion Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 font-bold text-lg">⚠️</div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black text-slate-900 tracking-tight">Delete {deleteTarget.type === 'exam' ? 'Exam Session' : 'Candidate'}?</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-2">
                {deleteTarget.type === 'exam' ? (
                  <>Candidate(s) registered to <span className="font-bold text-slate-800">"{deleteTarget.name}"</span> will also be removed.</>
                ) : (
                  <>Are you sure you want to permanently remove <span className="font-bold text-slate-800">"{deleteTarget.name}"</span> from this roster?</>
                )}
              </p>
            </div>
            <div className="flex gap-2 pt-1.5">
              <button onClick={() => setDeleteTarget(null)} disabled={isSaving} className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl active:scale-95 transition-all">Cancel</button>
              <button onClick={executeConfirmedDeletion} disabled={isSaving} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl active:scale-95 transition-all shadow-xs">
                {isSaving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col border-x border-slate-100">
        <header className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          {selectedExamId ? (
            <button onClick={() => { setSelectedExamId(null); router.push('/'); }} className="text-xs font-bold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl">← Sessions</button>
          ) : (
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">ScaleFlow</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Hub</p>
            </div>
          )}
          {sessionUser && <button onClick={handleLogout} className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Sign Out</button>}
        </header>

        <main className="p-4 flex-1 pb-24">
          {isLoading ? (
            <div className="text-center pt-12 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Portal...</div>
          ) : !sessionUser ? (
            <form onSubmit={handleLogin} className="space-y-4 pt-12">
              <div className="text-center mb-8">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">ScaleFlow Hub</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Sign in to your coordinator or teacher account</p>
              </div>
              {authError && <div className="text-rose-600 text-xs text-center font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">{authError}</div>}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block px-0.5">Email</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)} onBlur={handleEmailBlur} onFocus={handleEmailFocus}
                  className={`w-full bg-slate-50 border p-2.5 rounded-xl text-sm transition-all focus:bg-white focus:ring-2 ${emailValidationError ? 'border-rose-400 focus:ring-rose-100 bg-rose-50/10 text-rose-900' : 'border-slate-200 focus:ring-slate-900'}`}
                  placeholder="username.institution@scaleflow.com"
                />
                {emailValidationError && <div className="text-rose-500 text-[11px] font-medium px-1 pt-0.5">{emailValidationError}</div>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block px-0.5">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={!!emailValidationError} className="w-full bg-slate-900 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md mt-2">Sign In to Portal</button>
            </form>
          ) : (
            <>
              {!selectedExamId ? (
                <div className="space-y-6">
                  <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded uppercase font-black tracking-wider">{currentProfile?.role === 'admin' ? 'COORDINATOR ACCOUNT' : 'TEACHER ACCOUNT'}</span>
                    <h3 className="text-lg font-black mt-1.5 tracking-tight">Welcome, {currentProfile?.username || 'Academic Evaluator'}</h3>
                  </div>

                  {currentProfile?.role === 'admin' && (
                    <div className="space-y-4 border-b pb-6">
                      <form onSubmit={handleCreateExam} className="border rounded-2xl p-4 space-y-3 bg-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Generate New Session</span>
                        {examValidationError && <div className="text-rose-500 text-[11px] font-medium px-1 transition-all">{examValidationError}</div>}
                        <div className="grid grid-cols-3 gap-2">
                          <select value={buildType} onChange={(e) => setBuildType(e.target.value)} className={`bg-white border p-2 rounded-xl text-xs font-bold transition-all focus:ring-2 focus:ring-slate-900 ${examValidationError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}>
                            <option value="">Type...</option>
                            {['KET', 'PET', 'FCE', 'CAE', 'CPE'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select value={buildYear} onChange={(e) => setBuildYear(e.target.value)} className={`bg-white border p-2 rounded-xl text-xs font-bold transition-all focus:ring-2 focus:ring-slate-900 ${examValidationError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}>
                            <option value="">Year...</option>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={buildMonth} onChange={(e) => setBuildMonth(e.target.value)} className={`bg-white border p-2 rounded-xl text-xs font-bold transition-all focus:ring-2 focus:ring-slate-900 ${examValidationError ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'}`}>
                            <option value="">Month...</option>
                            {allMonths.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        {!isExamFormIncomplete && <div className="text-[11px] text-slate-500 font-medium animate-in fade-in duration-200 px-0.5">Preview: <span className="font-bold text-indigo-600">{`${buildType} ${buildYear} ${buildMonth}`}</span></div>}
                        <button type="submit" disabled={isSaving || isExamFormIncomplete || !!examValidationError} className="w-full h-10 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:bg-slate-300 active:scale-[0.99] transition-all flex items-center justify-center">Add Session</button>
                      </form>

                      <form onSubmit={handleDeployRoster} className="border rounded-2xl p-4 space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Register Candidate(s)</span>
                        <div className="space-y-1.5">
                          {studentValidationError && <div className="text-rose-500 text-[11px] font-medium px-1 transition-all">{studentValidationError}</div>}
                          <div className="flex gap-2">
                            <input type="text" placeholder="Enter Candidate Fullname" value={studentInput} onChange={(e) => setStudentInput(e.target.value)} className={`flex-1 bg-slate-50 border p-2 rounded-xl text-xs transition-all focus:bg-white focus:ring-2 ${studentValidationError ? 'border-rose-400 focus:ring-rose-100 bg-rose-50/10 text-rose-900' : 'border-slate-200 focus:ring-slate-900'}`} />
                            <button type="button" onClick={addStudentToQueue} disabled={!!studentValidationError || !studentInput.trim()} className="bg-slate-100 disabled:opacity-50 px-3 rounded-xl font-black transition-all">+</button>
                          </div>
                        </div>
                        {pendingStudents.length > 0 && <div className="text-xs text-slate-500 font-medium px-0.5">{pendingStudents.length} {pendingStudents.length === 1 ? 'candidate' : 'candidates'} in queue...</div>}
                        <select required value={targetExamId} onChange={(e) => setTargetExamId(e.target.value)} className="w-full bg-slate-50 border p-2 rounded-xl text-xs font-bold">
                          <option value="">-- Select Target Session --</option>
                          {allExams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <button type="submit" disabled={!!studentValidationError || !targetExamId} className="w-full h-10 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:bg-slate-300 active:scale-[0.99] transition-all flex items-center justify-center">Register Candidates</button>
                      </form>
                    </div>
                  )}

                  <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Active Sessions</h2>
                    <div className="space-y-2">
                      {allExams.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium italic text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No active assessment sessions found.</p>
                      ) : (
                        allExams.map((exam) => (
                          <div key={exam.id} onClick={() => { setSelectedExamId(String(exam.id)); router.push(`/?examId=${exam.id}`); }} className="bg-white border rounded-2xl p-4 flex justify-between items-center hover:border-slate-900 cursor-pointer shadow-xs transition-all duration-150">
                            <span className="font-bold text-sm uppercase text-slate-900">{exam.name}</span>
                            {currentProfile?.role === 'admin' && (
                              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'exam', id: exam.id, name: exam.name }); }} className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors">🗑️</button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-base font-black uppercase text-slate-900">{currentExam?.name}</h2>
                  </div>

                  {/* Print Action Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={printDoorList} disabled={activeStudents.length === 0} className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-[11px] font-bold py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer border border-slate-200/40">🖨️ Print Door List</button>
                    <button
                      onClick={handleFinishAttendance}
                      disabled={!allAttendanceMarked || currentExam?.attendance_locked}
                      className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-[11px] font-bold py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer border border-slate-200/40"
                    >
                      📝 Attendance Sheet
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    {activeStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        No candidates currently registered in this session.
                      </p>
                    ) : (
                      activeStudents.map((student) => {
                        // 1. New 5-State Status Badges
                        const statusBadges = {
                          'Pending': 'bg-slate-100 text-slate-500 border border-slate-200',
                          'Absent': 'bg-rose-50 text-rose-600 border border-rose-200',
                          'Present': 'bg-blue-50 text-blue-600 border border-blue-200',
                          'Partly Graded': 'bg-amber-50 text-amber-600 border border-amber-200',
                          'Fully Graded': 'bg-emerald-50 text-emerald-600 border border-emerald-200',
                        };

                        // 2. Rule set to determine button label based on status
                        const getButtonLabel = (status: string) => {
                          if (status === 'Partly Graded') return 'Continue Grading →';
                          if (status === 'Fully Graded') return 'Re-edit Completed Grading ⚙️';
                          return 'Start Grading →';
                        };

                        // Logical locks
                        const isGraded = student.status === 'Partly Graded' || student.status === 'Fully Graded';
                        // ADMIN DELETE LOCK: Only allowed if status is strictly 'Pending'
                        const canDelete = !student.status || student.status === 'Pending';

                        // Trigger function to print the student's final report
                        const printFinalReport = async (studentItem: any) => {
                          const mockInput: StudentExamInput = {
                            examType: (currentExam?.name.split(' ')[0] || 'FCE') as ExamType,
                            reading: studentItem.raw_scores?.reading || {},
                            listening: studentItem.raw_scores?.listening || {},
                            writing: studentItem.raw_scores?.writing || {},
                            speaking: studentItem.raw_scores?.speaking || {},
                            useOfEnglish: studentItem.raw_scores?.useOfEnglish || {}
                          };

                          const { calculateOverallResults } = require('@/lib/examEngine/calculator');
                          const computedResults = calculateOverallResults(mockInput);
                          const html = generateFinalReportHTML(studentItem.name, currentExam?.name || 'Exam', computedResults);
                          executePrint(html);
                        };

                        return (
                          <div key={student.id} className="bg-white border rounded-2xl p-4 shadow-xs transition-all duration-200 hover:shadow-md">

                            {/* HEADER ROW */}
                            <div className="flex justify-between items-center">

                              {/* LEFT SIDE: Name & Badge */}
                              <div className="flex flex-col items-start">
                                <span className="font-black text-sm uppercase text-slate-900 block tracking-tight">{student.name}</span>

                                {/* FIX 1: Pending, Partly Graded veya Fully Graded ise badge göster, Present/Absent ise GİZLE */}
                                {(!student.status || student.status === 'Pending' || student.status === 'Partly Graded' || student.status === 'Fully Graded') && (
                                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mt-1 uppercase ${(!student.status || student.status === 'Pending') ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                    statusBadges[student.status as keyof typeof statusBadges]
                                    }`}>
                                    {(!student.status || student.status === 'Pending') ? 'Pending' : student.status}
                                  </span>
                                )}
                              </div>

                              {/* RIGHT SIDE CONTROLS */}
                              <div className="flex items-center gap-2">

                                {/* FIX 2: Sadece sınav kilitli DEĞİLSE ve öğrenci henüz notlanmaya başlanmadıysa (Present/Absent seçimi aşamasındaysa) göster */}
                                {currentExam && !currentExam.attendance_locked && !isGraded && (
                                  <div className="w-[120px] flex justify-end">
                                    <div className="flex bg-slate-100/70 p-0.5 rounded-lg border border-slate-200/60 w-full">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); markAttendance(student.id, 'Present'); }}
                                        className={`flex-1 text-[10px] font-bold px-1 py-1 rounded-md transition-all ${student.status === 'Present' ? 'bg-white shadow-sm text-blue-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                                      >Present</button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); markAttendance(student.id, 'Absent'); }}
                                        className={`flex-1 text-[10px] font-bold px-1 py-1 rounded-md transition-all ${student.status === 'Absent' ? 'bg-white shadow-sm text-rose-600 border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                                      >Absent</button>
                                    </div>
                                  </div>
                                )}

                                {/* SLOT 2: ADMIN DELETE BUTTON */}
                                {currentProfile?.role === 'admin' && (
                                  <div className="w-8 flex justify-center">
                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setDeleteTarget({ type: 'student', id: student.id, name: student.name }); }}
                                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors text-sm"
                                      >🗑️</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* TEACHER ACTION AREA */}
                            {currentProfile?.role !== 'admin' && (
                              <div className="space-y-2 pt-3 mt-3 border-t border-slate-50">

                                {/* Bilgilendirme metni */}
                                {currentExam && !currentExam.attendance_locked && !isGraded && (
                                  <p className="text-[11px] text-slate-400 font-medium italic text-center py-1">
                                    Mark attendance to proceed.
                                  </p>
                                )}

                                {/* Puanlama butonları */}
                                {(currentExam?.attendance_locked || isGraded || student.status === 'Present') && (
                                  <>
                                    {student.status === 'Fully Graded' && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); printFinalReport(student); }}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                                      >🎓 Take Final Report (PDF)</button>
                                    )}

                                    {(student.status === 'Present' || isGraded) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const inferredType = currentExam?.name.split(' ')[0] || 'FCE';
                                          router.push(`/assessment?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&examType=${inferredType}&examId=${selectedExamId}`);
                                        }}
                                        className={`w-full text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 ${student.status === 'Fully Graded' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' :
                                          student.status === 'Partly Graded' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                                          }`}
                                      >
                                        {getButtonLabel(student.status)}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}