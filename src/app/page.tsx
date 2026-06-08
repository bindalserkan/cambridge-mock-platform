'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

export default function Home() {
  // Authentication & RBAC States
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  // Structural Data States
  const [allExams, setAllExams] = useState<any[]>([]);
  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Form Inputs & Explicit Queue-Based Registration System
  const [newExamName, setNewExamName] = useState<string>('');
  const [newExamLevel, setNewExamLevel] = useState<string>('B2');
  const [studentInput, setStudentInput] = useState<string>('');
  const [pendingStudents, setPendingStudents] = useState<string[]>([]);
  const [targetExamId, setTargetExamId] = useState<string>('');

  // UI Status & Custom Toast Notification System
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Custom Toast Trigger Function
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function checkActiveSession() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
        await fetchUserProfile(session.user.email!);
      }
      setIsLoading(false);
    }
    checkActiveSession();
  }, []);

  const fetchUserProfile = async (userEmail: string) => {
    const { data } = await supabase.from('profiles').select('id, name, email, role').eq('email', userEmail).maybeSingle();
    if (data) {
      setCurrentProfile(data);
      await loadGlobalData();
    }
  };

  const loadGlobalData = async () => {
    setIsLoading(true);
    const { data: exams } = await supabase.from('exams').select('id, name, level').order('id', { ascending: false });
    if (exams) setAllExams(exams);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!selectedExamId) {
      setActiveStudents([]);
      return;
    }
    async function fetchStudents() {
      setIsLoading(true);
      const { data } = await supabase.from('students').select('id, name, writing_score, speaking_score, status').eq('exam_id', selectedExamId).order('name', { ascending: true });
      if (data) setActiveStudents(data);
      setIsLoading(false);
    }
    fetchStudents();
  }, [selectedExamId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName) return;
    setIsSaving(true);
    const { error } = await supabase.from('exams').insert({ name: newExamName, level: newExamLevel });
    if (error) {
      showNotification(error.message, 'error');
    } else {
      setNewExamName('');
      await loadGlobalData();
      showNotification('New exam session successfully published to the pool.');
    }
    setIsSaving(false);
  };

  // EXPLICIT PLUS BUTTON TRIGGER (Appends named candidate to the local staging array)
  const addStudentToQueue = () => {
    const trimmed = studentInput.trim();
    if (!trimmed) return;
    
    if (pendingStudents.includes(trimmed)) {
      showNotification('This student name is already in your staging list.', 'error');
      return;
    }

    setPendingStudents([...pendingStudents, trimmed]);
    setStudentInput('');
  };

  const removePendingStudent = (indexToRemove: number) => {
    setPendingStudents(pendingStudents.filter((_, idx) => idx !== indexToRemove));
  };

  // BULK DATABASE INJECTION OVER COHORT STAGING ARRAY
  const handleDeployStagedRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingStudents.length === 0 || !targetExamId) {
      showNotification('Staging area is empty or target session is unselected.', 'error');
      return;
    }
    setIsSaving(true);

    const payload = pendingStudents.map(studentName => ({
      name: studentName,
      exam_id: Number(targetExamId)
    }));

    const { error } = await supabase.from('students').insert(payload);

    if (error) {
      showNotification(error.message, 'error');
    } else {
      const deployedCount = pendingStudents.length;
      setPendingStudents([]);
      setStudentInput('');
      
      if (String(targetExamId) === String(selectedExamId)) {
        setSelectedExamId(null);
        setTimeout(() => setSelectedExamId(targetExamId), 50);
      }
      showNotification(`Successfully deployed ${deployedCount} students to the secure institutional database.`);
    }
    setIsSaving(false);
  };

  const handleScoreChange = (studentId: string, field: 'writing_score' | 'speaking_score', value: string) => {
    if (currentProfile?.role === 'admin') return; 
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 20)) return;
    
    setActiveStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const updated = { ...s, [field]: value };
        updated.status = updated.writing_score && updated.speaking_score ? 'Graded' : 'Pending';
        return updated;
      }
      return s;
    }));
  };

  const handleSyncSession = async () => {
    if (currentProfile?.role === 'admin') return;
    setIsSaving(true);
    for (const student of activeStudents) {
      await supabase.from('students').update({
        writing_score: student.writing_score,
        speaking_score: student.speaking_score,
        status: student.status
      }).eq('id', student.id);
    }
    setIsSaving(false);
    showNotification('Assessment data successfully synced with the cloud database.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { 
      setAuthError(error.message); 
      setIsLoading(false); 
    } else if (data?.user) { 
      setSessionUser(data.user); 
      await fetchUserProfile(data.user.email!); 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setCurrentProfile(null);
    setSelectedExamId(null);
    setEmail('');
    setPassword('');
    setStudentInput('');
    setPendingStudents([]);
  };

  const triggerPrint = () => {
    window.print();
  };

  const currentExam = allExams.find(e => String(e.id) === String(selectedExamId));
  const gradedCount = activeStudents.filter(s => s.status === 'Graded').length;
  const totalStudents = activeStudents.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex justify-center print:bg-white print:p-0">
      
      {/* GLOBAL TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className={`fixed top-4 max-w-sm w-full mx-4 shadow-xl rounded-2xl p-4 z-50 text-white font-semibold flex items-center gap-3 transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <p className="text-xs tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* PRINT-READY DOOR ATTENDANCE MATRIX */}
      <div className="hidden print:block w-full p-8 space-y-6">
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900">ScaleFlow Mock Examination</h1>
          <p className="text-sm font-bold text-slate-600">Exam Attendance & Door Roster</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm font-bold bg-slate-100 p-3 rounded-lg border border-slate-200">
          <div>Exam Session: <span className="font-normal text-slate-700">{currentExam?.name}</span></div>
          <div className="text-right">Level / Type: <span className="font-normal text-slate-700">{currentExam?.level}</span></div>
        </div>
        <table className="w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="bg-slate-200 text-slate-800">
              <th className="border border-slate-300 p-2.5 text-left w-12">No</th>
              <th className="border border-slate-300 p-2.5 text-left">Student Full Name</th>
              <th className="border border-slate-300 p-2.5 text-center w-32">Signature</th>
              <th className="border border-slate-300 p-2.5 text-center w-32">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {activeStudents.map((student, idx) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="border border-slate-300 p-2.5 font-mono text-center">{idx + 1}</td>
                <td className="border border-slate-300 p-2.5 font-bold uppercase">{student.name}</td>
                <td className="border border-slate-300 p-2.5"></td>
                <td className="border border-slate-300 p-2.5 text-xs text-slate-400 text-center">Cambridge Format</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pt-12 grid grid-cols-2 text-xs font-bold text-slate-400">
          <div>Date Generated: {new Date().toLocaleDateString('en-US')}</div>
          <div>ScaleFlow Institutional Management Systems</div>
        </div>
      </div>

      {/* MAIN SCREEN APPLICATION FRAME */}
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col relative border-x border-slate-100 print:hidden">
        
        {/* Sticky Header */}
        <header className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
          {selectedExamId ? (
            <button onClick={() => setSelectedExamId(null)} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl cursor-pointer">
              ← Back to Exam Pool
            </button>
          ) : (
            <div>
              <h1 className="text-xl font-bold tracking-tight text-indigo-600">ScaleFlow</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Mock Exam Management & Assessment Matrix</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {sessionUser && (
              <button onClick={handleLogout} className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md cursor-pointer">
                Sign Out
              </button>
            )}
            <span className={`h-2.5 w-2.5 rounded-full ${isLoading || isSaving ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`}></span>
          </div>
        </header>

        <main className="p-4 flex-1 pb-24">
          {!sessionUser ? (
            /* Gateway Login Form */
            <form onSubmit={handleLogin} className="space-y-4 pt-12">
              <div className="text-center space-y-1.5 mb-8">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">ScaleFlow Corporate Login Portal</h2>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto">Secure assessment, grading, and administrative management infrastructure.</p>
              </div>
              {authError && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3 rounded-xl text-center">{authError}</div>}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" placeholder="name@school.com" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl shadow-md cursor-pointer transition-all mt-2">
                {isLoading ? 'Verifying...' : 'Secure Sign In'}
              </button>
            </form>
          ) : (
            <>
              {/* VIEWPORT 1: Global Exam Selection Pool */}
              {!selectedExamId ? (
                <div className="space-y-6">
                  {/* Dynamic Role Banner */}
                  <div className={`rounded-2xl p-4 border ${currentProfile?.role === 'admin' ? 'bg-amber-50/60 border-amber-200/60' : 'bg-indigo-50/60 border-indigo-100/60'}`}>
                    <span className={`text-[9px] font-black tracking-widest text-white px-2 py-0.5 rounded-md uppercase ${currentProfile?.role === 'admin' ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                      {currentProfile?.role === 'admin' ? 'Administrative Staff / Coordinator' : 'Academic Evaluator'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">Welcome, {currentProfile?.name}</h3>
                    <p className="text-xs text-slate-500">Connected to the centralized institutional exam pool.</p>
                  </div>

                  {/* ADMIN ONLY: Generation Control Blocks */}
                  {currentProfile?.role === 'admin' && (
                    <div className="space-y-4 border-b border-slate-100 pb-6">
                      {/* Form A: Deploy Exam */}
                      <form onSubmit={handleCreateExam} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Define New Exam Session</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <input type="text" required placeholder="Session Name (e.g., FCE Mock)" value={newExamName} onChange={(e) => setNewExamName(e.target.value)} className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white" />
                          <select value={newExamLevel} onChange={(e) => setNewExamLevel(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none font-bold">
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                          </select>
                        </div>
                        <button type="submit" disabled={isSaving} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl cursor-pointer">
                          Publish Session
                        </button>
                      </form>

                      {/* Form B: EXPLICIT SIDE-BUTTON INFLUX STAGING FORM */}
                      <form onSubmit={handleDeployStagedRoster} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Staging Roster Builder</h4>
                          {pendingStudents.length > 0 && (
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                              {pendingStudents.length} Staged
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {/* Input field connected to a small explicit plus button */}
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              placeholder="Enter student full name" 
                              value={studentInput}
                              onChange={(e) => setStudentInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStudentToQueue(); } }}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" 
                            />
                            <button 
                              type="button" 
                              onClick={addStudentToQueue}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-black px-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                              title="Add student to current staging list"
                            >
                              +
                            </button>
                          </div>

                          {/* DYNAMIC LIST MATRIX: Displays staged candidates with top-right action trigger */}
                          {pendingStudents.length > 0 && (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                              {pendingStudents.map((name, index) => (
                                <div key={index} className="relative flex justify-between items-center bg-white border border-slate-200/60 px-3 py-2 rounded-lg pr-8 shadow-2xs">
                                  <span className="text-xs font-semibold text-slate-700 truncate uppercase tracking-tight">{name}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => removePendingStudent(index)}
                                    className="absolute top-1.5 right-2 text-slate-300 hover:text-rose-600 font-bold transition-colors cursor-pointer text-sm leading-none"
                                    title="Remove candidate from staging list"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <select required value={targetExamId} onChange={(e) => setTargetExamId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-600 font-semibold">
                          <option value="">-- Select Target Exam Session --</option>
                          {allExams.map(e => <option key={e.id} value={e.id}>[{e.level}] {e.name}</option>)}
                        </select>
                        <button type="submit" disabled={isSaving || pendingStudents.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all">
                          Inject Staged List to Exam
                    </button>
                      </form>
                    </div>
                  )}

                  {/* Active Pool Sheet */}
                  <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Active Institutional Exam Pool</h2>
                    <div className="space-y-2.5">
                      {allExams.map((exam) => (
                        <button key={exam.id} onClick={() => setSelectedExamId(String(exam.id))} className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 transition-all flex justify-between items-center group shadow-xs hover:border-indigo-500 hover:shadow-md cursor-pointer">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mr-2">{exam.level}</span>
                            <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600">{exam.name}</span>
                          </div>
                          <span className="text-slate-300 group-hover:text-indigo-500">→</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                /* VIEWPORT 2: Granular Evaluation Sheet */
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md uppercase">{currentExam?.level} Level</span>
                      <h2 className="text-lg font-black text-slate-900 mt-1">{currentExam?.name}</h2>
                    </div>
                    {currentProfile?.role === 'admin' && (
                      <button onClick={triggerPrint} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-indigo-100 cursor-pointer">
                        🖨️ Print Attendance List
                      </button>
                    )}
                  </div>

                  {/* Operational Metrics Panel */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md grid grid-cols-2 text-center">
                    <div className="border-r border-slate-800">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Registered Students</p>
                      <p className="text-xl font-black text-indigo-400 mt-0.5">{totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Graded</p>
                      <p className="text-xl font-black text-emerald-400 mt-0.5">{gradedCount} <span className="text-xs text-slate-500">candidates</span></p>
                    </div>
                  </div>

                  {/* Student Assessment List Matrix */}
                  <section className="space-y-3.5">
                    {activeStudents.map((student) => (
                      <div key={student.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-800 uppercase tracking-tight">{student.name}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${student.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{student.status}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {currentProfile?.role === 'admin' ? (
                            <>
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Writing</span>
                                <span className="text-sm font-black text-slate-700">{student.writing_score ?? '--'}</span>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Speaking</span>
                                <span className="text-sm font-black text-slate-700">{student.speaking_score ?? '--'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">Writing (0-20)</label>
                                <input type="text" placeholder="--" value={student.writing_score || ''} onChange={(e) => handleScoreChange(student.id, 'writing_score', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">Speaking (0-20)</label>
                                <input type="text" placeholder="--" value={student.speaking_score || ''} onChange={(e) => handleScoreChange(student.id, 'speaking_score', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>

                  {/* Save Matrix Button */}
                  {currentProfile?.role !== 'admin' && (
                    <button disabled={isSaving} onClick={handleSyncSession} className={`w-full py-3.5 rounded-xl font-black text-sm shadow-md transition-all text-center text-white ${isSaving ? 'bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'}`}>
                      {isSaving ? 'Syncing Cloud...' : 'Save Scores & Lock Session'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}