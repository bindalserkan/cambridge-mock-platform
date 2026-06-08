'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

export default function Home() {
  // Authentication & Session States
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Relational Data States
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [dbExams, setDbExams] = useState<any[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>([]);

  // Selection & UI States
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Check active session on component mount (Persistent Login)
  useEffect(() => {
    async function checkActiveSession() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setSessionUser(session.user);
        await fetchTeacherProfile(session.user.email!);
      }
      setIsLoading(false);
    }
    checkActiveSession();
  }, []);

  // Bridge Function: Link Supabase Auth User with custom PostgreSQL 'teachers' table via email
  const fetchTeacherProfile = async (userEmail: string) => {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, name, email')
      .eq('email', userEmail)
      .maybeSingle(); // Changed from .single() to handle 0 rows gracefully

    if (error) {
      console.error('Backend Error [Profile Mapping]:', error.message);
    } else if (data) {
      // If a matching teacher profile exists in PostgreSQL
      setCurrentTeacher(data);
      await fetchExamsForTeacher(data.id);
    } else {
      // If user is authenticated in Auth but has no profile record in 'teachers' table
      console.warn(`Authenticated user ${userEmail} has no matching record in teachers table.`);
      setCurrentTeacher(null);
    }
  };

  // Fetch assigned exams using teacher's relational ID
  const fetchExamsForTeacher = async (teacherId: number) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('exams')
      .select('id, name, level')
      .eq('teacher_id', teacherId);

    if (error) console.error('Database Error [Exams Fetch]:', error.message);
    else if (data) setDbExams(data);
    setIsLoading(false);
  };

  // Fetch student roster whenever an exam session is activated
  useEffect(() => {
    if (!selectedExamId) {
      setDbStudents([]);
      return;
    }

    async function fetchStudents() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('id, name, writing_score, speaking_score, status')
        .eq('exam_id', selectedExamId)
        .order('name', { ascending: true });

      if (error) console.error('Database Error [Students Fetch]:', error.message);
      else if (data) setDbStudents(data);
      setIsLoading(false);
    }
    fetchStudents();
  }, [selectedExamId]);

  // Handle standard secure email/password authentication
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
      await fetchTeacherProfile(data.user.email!);
    }
  };

  // Terminate secure session and clear local states
  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setSessionUser(null);
    setCurrentTeacher(null);
    setDbExams([]);
    setSelectedExamId(null);
    setIsLoading(false);
  };

  // Local UI state update handler for inputting grades
  const handleScoreChange = (studentId: string, field: 'writing_score' | 'speaking_score', value: string) => {
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 20)) return;

    setDbStudents(prev =>
      prev.map(student => {
        if (student.id === studentId) {
          const updated = { ...student, [field]: value };
          updated.status = updated.writing_score && updated.speaking_score ? 'Graded' : 'Pending';
          return updated;
        }
        return student;
      })
    );
  };

  // Batch update trigger to lock local scores into cloud database
  const handleSyncSession = async () => {
    setIsSaving(true);
    for (const student of dbStudents) {
      const { error } = await supabase
        .from('students')
        .update({
          writing_score: student.writing_score,
          speaking_score: student.speaking_score,
          status: student.status
        })
        .eq('id', student.id);

      if (error) {
        console.error(`Transaction Sync Failed for Student ID ${student.id}:`, error.message);
        alert('Sync failed. Integrity preserved.');
        setIsSaving(false);
        return;
      }
    }
    setIsSaving(false);
    alert('Cloud PostgreSQL successfully synchronized!');
  };

  // Reactive calculations for progress indicators
  const currentExam = dbExams.find(e => String(e.id) === String(selectedExamId));
  const gradedCount = dbStudents.filter(s => s.status === 'Graded').length;
  const totalStudentsCount = dbStudents.length;
  const classAverage = gradedCount > 0 
    ? (dbStudents.reduce((acc, curr) => curr.status === 'Graded' ? acc + ((Number(curr.writing_score) + Number(curr.speaking_score)) / 2) : acc, 0) / gradedCount).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col relative border-x border-slate-100">
        
        {/* App Header */}
        <header className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
          {selectedExamId ? (
            <button 
              onClick={() => setSelectedExamId(null)}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              ← Back to Sessions
            </button>
          ) : (
            <div>
              <h1 className="text-xl font-bold tracking-tight text-indigo-600">ScaleFlow</h1>
              <p className="text-xs text-slate-400">Secure Identity & Data Platform</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {sessionUser && !selectedExamId && (
              <button onClick={handleLogout} className="text-[11px] font-bold text-rose-600 hover:underline bg-rose-50 px-2 py-1 rounded-md cursor-pointer">
                Logout
              </button>
            )}
            <span className={`h-2.5 w-2.5 rounded-full ${isLoading || isSaving ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`}></span>
          </div>
        </header>

        {/* Dynamic Main Body */}
        <main className="p-4 flex-1 pb-24">
          
          {/* CONDITION 1: User Not Logged In -> Render Secure Gate */}
          {!sessionUser ? (
            <div className="space-y-6 pt-10">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Examiner Portal</h2>
                <p className="text-sm text-slate-400">Enter secure school credentials to synchronize mocks.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {authError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3 rounded-xl text-center">
                    {authError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Institutional Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="name@school.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  {isLoading ? 'Authenticating Identity...' : 'Secure Sign In'}
                </button>
              </form>
            </div>
          ) : (
            
            /* CONDITION 2: User Authenticated -> Render Dashboard Views */
            <>
              {!selectedExamId ? (
                <div className="space-y-6">
                  {/* Dynamic Welcome Greeting Banner */}
                  <section className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                    <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">Authenticated Account</p>
                    <h3 className="text-base font-bold text-slate-900">Welcome back, {currentTeacher?.name || 'Examiner'}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{sessionUser.email}</p>
                  </section>

                  {/* Sessions allocated exclusively to this teacher */}
                  <section>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Your Assigned Sessions</h2>
                    <div className="space-y-3">
                      {dbExams.map((exam) => (
                        <button
                          key={exam.id}
                          onClick={() => setSelectedExamId(String(exam.id))}
                          className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 transition-all flex justify-between items-center group shadow-xs hover:border-indigo-500 hover:shadow-md cursor-pointer"
                        >
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mr-2">{exam.level}</span>
                            <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600">{exam.name}</span>
                          </div>
                          <span className="text-slate-300 group-hover:text-indigo-500 transition-colors">→</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                /* VIEW: Live Student Score Board */
                <div className="space-y-6">
                  <section className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Live Class Average</p>
                      <p className="text-2xl font-black text-indigo-400 mt-1">{classAverage} <span className="text-xs text-slate-400">/ 20</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Grading Progress</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{gradedCount} <span className="text-xs text-slate-400">of {totalStudentsCount}</span></p>
                    </div>
                    <div className="col-span-2 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalStudentsCount > 0 ? (gradedCount / totalStudentsCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </section>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{currentExam?.name}</h2>
                    <p className="text-xs text-slate-400">Session ID: {selectedExamId} | Active Tracking</p>
                  </div>

                  <section className="space-y-4">
                    {dbStudents.map((student) => (
                      <div key={student.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm text-slate-800">{student.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            student.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {student.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Writing (0-20)</label>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              placeholder="--"
                              value={student.writing_score}
                              onChange={(e) => handleScoreChange(student.id, 'writing_score', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Speaking (0-20)</label>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              placeholder="--"
                              value={student.speaking_score}
                              onChange={(e) => handleScoreChange(student.id, 'speaking_score', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </section>

                  <button 
                    disabled={isSaving}
                    onClick={handleSyncSession}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all text-center mt-4 text-white
                      ${isSaving ? 'bg-amber-500 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer active:scale-[0.98]'}`}
                  >
                    {isSaving ? 'Syncing with Cloud PostgreSQL...' : 'Lock & Sync Session'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}