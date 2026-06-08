'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient'; // Importing the Supabase client bridge

// Temporary mock data for exams until database migration
const MOCK_EXAMS = [
  { id: '1', name: 'FCE Mock - June 2026', level: 'B2', totalStudents: 4 },
  { id: '2', name: 'CAE Mock - Summer Intensive', level: 'C1', totalStudents: 3 },
];

export default function Home() {
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  
  // State management for relational database data
  const [dbTeachers, setDbTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch verified teachers from cloud database on component mount
  useEffect(() => {
    async function fetchTeachersFromDatabase() {
      setIsLoading(true);
      
      // Requesting specific columns from 'teachers' table to optimize payload
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name');

      if (error) {
        console.error('Database Error: Failed to fetch teachers ->', error.message);
      } else if (data) {
        setDbTeachers(data); // Syncing cloud data with UI state
      }
      setIsLoading(false);
    }

    fetchTeachersFromDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col relative border-x border-slate-100">
        
        {/* Application Header */}
        <header className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-indigo-600">ScaleFlow</h1>
            <p className="text-xs text-slate-400">Database Connected MVP</p>
          </div>
          {/* Visual indicator for database sync status */}
          <span className={`h-2.5 w-2.5 rounded-full ${isLoading ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`}></span>
        </header>

        {/* Main Content Area */}
        <main className="p-4 flex-1 pb-24">
          {!selectedExamId ? (
            <div className="space-y-6">
              
              {/* Profile Selector - Powered by Live PostgreSQL */}
              <section className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-2">
                  Teacher Profile (Live PostgreSQL Database)
                </label>
                {isLoading ? (
                  <p className="text-xs text-slate-400 animate-pulse">Connecting to cloud database...</p>
                ) : (
                  <select 
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                  >
                    <option value="">-- Select from Database --</option>
                    {dbTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                )}
              </section>

              {/* Exam Sessions List */}
              <section>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Available Sessions</h2>
                <div className="space-y-3">
                  {MOCK_EXAMS.map((exam) => (
                    <button
                      key={exam.id}
                      disabled={!selectedTeacher}
                      onClick={() => setSelectedExamId(exam.id)}
                      className={`w-full text-left bg-white border rounded-2xl p-4 transition-all flex justify-between items-center group shadow-xs
                        ${selectedTeacher ? 'border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'}`}
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
            /* Inside Session Confirmation View */
            <div className="p-4 text-center space-y-4">
              <p className="text-sm text-slate-600">Database bridge established successfully. In the next sprint, we will migrate exam data to PostgreSQL!</p>
              <button onClick={() => setSelectedExamId(null)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
                Go Back
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}