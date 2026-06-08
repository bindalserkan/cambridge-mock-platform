'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

export default function Home() {
  // State management for relational data layers
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);
  const [dbExams, setDbExams] = useState<any[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>([]);

  // State management for selections and UI status
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch all teachers from database on initial component mount
  useEffect(() => {
    async function fetchTeachers() {
      setIsLoading(true);
      const { data, error } = await supabase.from('teachers').select('id, name');
      if (error) console.error('Database Error [Teachers]:', error.message);
      else if (data) setDbTeachers(data);
      setIsLoading(false);
    }
    fetchTeachers();
  }, []);

  // Fetch assigned exams automatically whenever a specific teacher is selected
  useEffect(() => {
    if (!selectedTeacherId) {
      setDbExams([]);
      return;
    }

    async function fetchExams() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('exams')
        .select('id, name, level')
        .eq('teacher_id', selectedTeacherId); // Filtering rows where foreign key matches

      if (error) console.error('Database Error [Exams]:', error.message);
      else if (data) setDbExams(data);
      setIsLoading(false);
    }
    fetchExams();
  }, [selectedTeacherId]);

  // Fetch registered students automatically whenever an exam session is opened
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
        .order('name', { ascending: true }); // Keep list alphabetized

      if (error) console.error('Database Error [Students]:', error.message);
      else if (data) setDbStudents(data);
      setIsLoading(false);
    }
    fetchStudents();
  }, [selectedExamId]);

  // Handle local UI state updates when typing scores (Validation included)
  const handleScoreChange = (studentId: string, field: 'writing_score' | 'speaking_score', value: string) => {
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 20)) return;

    setDbStudents(prev =>
      prev.map(student => {
        if (student.id === studentId) {
          const updated = { ...student, [field]: value };
          // Automatically compute status based on score completeness
          updated.status = updated.writing_score && updated.speaking_score ? 'Graded' : 'Pending';
          return updated;
        }
        return student;
      })
    );
  };

  // Bulk update function to save all student scores back to PostgreSQL
  const handleSyncSession = async () => {
    setIsSaving(true);
    
    // Iterate and update each student record in the cloud database
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
        console.error(`Sync Error for Student ID ${student.id}:`, error.message);
        alert('Failed to sync some records. Check console.');
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    alert('Database Synchronized Successfully! All scores are securely locked in cloud.');
  };

  // Reactive calculations for progress tracking dashboard
  const currentExam = dbExams.find(e => String(e.id) === String(selectedExamId));
  const gradedCount = dbStudents.filter(s => s.status === 'Graded').length;
  const totalStudentsCount = dbStudents.length;
  const totalScores = dbStudents.reduce((acc, curr) => {
    if (curr.status === 'Graded') {
      const avg = (Number(curr.writing_score) + Number(curr.speaking_score)) / 2;
      return acc + avg;
    }
    return acc;
  }, 0);
  const classAverage = gradedCount > 0 ? (totalScores / gradedCount).toFixed(1) : '0.0';

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
              <p className="text-xs text-slate-400">100% Data-Driven Architecture</p>
            </div>
          )}
          <span className={`h-2.5 w-2.5 rounded-full ${isLoading || isSaving ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`}></span>
        </header>

        {/* Main Content Layout */}
        <main className="p-4 flex-1 pb-24">
          
          {/* VIEW 1: Teacher & Exam Session Selector */}
          {!selectedExamId ? (
            <div className="space-y-6">
              
              {/* Dynamic Teacher Selection */}
              <section className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-2">
                  Select Registered Examiner
                </label>
                <select 
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                >
                  <option value="">-- Fetching from PostgreSQL --</option>
                  {dbTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </section>

              {/* Dynamic Exam List filtered by selected teacher */}
              <section>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Assigned Exam Sessions</h2>
                <div className="space-y-3">
                  {dbExams.length === 0 && selectedTeacherId && !isLoading && (
                    <p className="text-xs text-slate-400">No exams assigned to this teacher in database.</p>
                  )}
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
            
            /* VIEW 2: Dynamic Student Score Board */
            <div className="space-y-6">
              
              {/* Dynamic Statistics Bar */}
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

              {/* Active Session Meta Data */}
              <div>
                <h2 className="text-lg font-bold text-slate-900">{currentExam?.name}</h2>
                <p className="text-xs text-slate-400">Session ID: {selectedExamId} | Active Tracking</p>
              </div>

              {/* Student Score Input Cards */}
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

              {/* Sync Button to trigger batch database update */}
              <button 
                disabled={isSaving}
                onClick={handleSyncSession}
                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all text-center mt-4 text-white
                  ${isSaving 
                    ? 'bg-amber-500 cursor-wait' 
                    : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer active:scale-[0.98]'}`}
              >
                {isSaving ? 'Syncing with Cloud PostgreSQL...' : 'Lock & Sync Session'}
              </button>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}