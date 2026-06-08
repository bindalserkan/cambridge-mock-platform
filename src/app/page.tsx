'use client';

import { useState } from 'react';

// 1. Statik Sınav Verileri
const MOCK_EXAMS = [
  { id: '1', name: 'FCE Mock - June 2026', level: 'B2', totalStudents: 4 },
  { id: '2', name: 'CAE Mock - Summer Intensive', level: 'C1', totalStudents: 3 },
];

// 2. Simüle Edilmiş Öğrenci Listesi (Veritabanı yerine geçici state için ilk veriler)
const INITIAL_STUDENTS = [
  { id: 's1', name: 'Ahmet Yılmaz', writingScore: '', speakingScore: '', status: 'Pending' },
  { id: 's2', name: 'Elif Kaya', writingScore: '15', speakingScore: '17', status: 'Graded' },
  { id: 's3', name: 'Can Demir', writingScore: '', speakingScore: '', status: 'Pending' },
  { id: 's4', name: 'Zeynep Çelik', writingScore: '18', speakingScore: '19', status: 'Graded' },
];

export default function Home() {
  // Eyalet (State) Yönetimleri
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [students, setStudents] = useState(INITIAL_STUDENTS);

  // Seçilen sınavın detaylarını buluyoruz
  const currentExam = MOCK_EXAMS.find(e => e.id === selectedExamId);

  // Canlı Not Güncelleme Fonksiyonu
  const handleScoreChange = (studentId: string, field: 'writingScore' | 'speakingScore', value: string) => {
    // Girilen notun 0-20 arasında olmasını kontrol ediyoruz (Cambridge Skalası Taslağı)
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 20)) return;

    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === studentId) {
          const updatedStudent = { ...student, [field]: value };
          // Eğer iki not da girildiyse durumu 'Graded' yap, yoksa 'Pending'
          updatedStudent.status = updatedStudent.writingScore && updatedStudent.speakingScore ? 'Graded' : 'Pending';
          return updatedStudent;
        }
        return student;
      })
    );
  };

  // Canlı İstatistik Hesaplamaları (React Compiler bunları otomatik optimize eder)
  const gradedCount = students.filter(s => s.status === 'Graded').length;
  const totalStudentsCount = students.length;
  
  const totalScores = students.reduce((acc, curr) => {
    if (curr.status === 'Graded') {
      const avg = (Number(curr.writingScore) + Number(curr.speakingScore)) / 2;
      return acc + avg;
    }
    return acc;
  }, 0);
  const classAverage = gradedCount > 0 ? (totalScores / gradedCount).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col relative border-x border-slate-100">
        
        {/* 🏛️ Üst Bar (Header) */}
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
              <p className="text-xs text-slate-400">Mock Exam Management</p>
            </div>
          )}
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </header>

        {/* 📜 ANA İÇERİK ALANI */}
        <main className="p-4 flex-1 pb-24">
          
          {/* EKRAN 1: SINAV SEÇİM EKRANI (selectedExamId yoksa gösterilir) */}
          {!selectedExamId ? (
            <div className="space-y-6">
              {/* Öğretmen Seçici */}
              <section className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-2">
                  Teacher Profile Selector
                </label>
                <select 
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                >
                  <option value="">-- Select Your Name --</option>
                  <option value="Serkan Bindal">Serkan Bindal</option>
                  <option value="Jane Doe">Jane Doe</option>
                </select>
              </section>

              {/* Sınav Listesi */}
              <section>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Available Sessions</h2>
                <div className="space-y-3">
                  {MOCK_EXAMS.map((exam) => (
                    <button
                      key={exam.id}
                      disabled={!selectedTeacher}
                      onClick={() => setSelectedExamId(exam.id)}
                      className={`w-full text-left bg-white border rounded-2xl p-4 transition-all flex justify-between items-center group shadow-xs
                        ${selectedTeacher 
                          ? 'border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer' 
                          : 'border-slate-100 opacity-60 cursor-not-allowed'
                        }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mr-2">{exam.level}</span>
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600">{exam.name}</span>
                        <p className="text-xs text-slate-400 mt-1">Students registered: {exam.totalStudents}</p>
                      </div>
                      <span className="text-slate-300 group-hover:text-indigo-500 transition-colors">→</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            
            /* EKRAN 2: ÖĞRENCİ LİSTESİ VE PUAN GİRİŞ EKRANI (selectedExamId varsa gösterilir) */
            <div className="space-y-6">
              
              {/* 📊 Canlı Özet Bandı (Sticky Progress Dashboard) */}
              <section className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Class Average</p>
                  <p className="text-2xl font-black text-indigo-400 mt-1">{classAverage} <span className="text-xs text-slate-400">/ 20</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Grading Progress</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{gradedCount} <span className="text-xs text-slate-400">of {totalStudentsCount}</span></p>
                </div>
                <div className="col-span-2 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(gradedCount / totalStudentsCount) * 100}%` }}
                  ></div>
                </div>
              </section>

              {/* Sınav Başlığı */}
              <div>
                <h2 className="text-lg font-bold text-slate-900">{currentExam?.name}</h2>
                <p className="text-xs text-slate-400">Assigned Examiner: {selectedTeacher}</p>
              </div>

              {/* Öğrenci Puan Kartları */}
              <section className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-slate-800">{student.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        student.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {student.status}
                      </span>
                    </div>

                    {/* Not Giriş Kutuları */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Writing (0-20)</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="--"
                          value={student.writingScore}
                          onChange={(e) => handleScoreChange(student.id, 'writingScore', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Speaking (0-20)</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="--"
                          value={student.speakingScore}
                          onChange={(e) => handleScoreChange(student.id, 'speakingScore', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Kaydet ve İlerle Butonu */}
              <button 
                disabled={gradedCount !== totalStudentsCount}
                onClick={() => alert('Scores locked! Ready to sync with external system (Google Sheets/LMS)...')}
                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all text-center mt-4
                  ${gradedCount === totalStudentsCount 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer active:scale-[0.98]' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
              >
                Lock & Sync Session
              </button>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}