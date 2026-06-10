'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ExamType, StudentExamInput } from '@/lib/examEngine/types';
import { calculateOverallResults } from '@/lib/examEngine/calculator';

// Import your custom interactive assessment modules with correct named imports
import { ScoringSheet } from '@/components/grading/ScoringSheet';
import { LiveScoreCard } from '@/components/grading/LiveScoreCard';

type SectionType = 'reading' | 'useOfEnglish' | 'writing' | 'listening' | 'speaking';

function AssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route query contexts
  const studentId = searchParams.get('studentId');
  const studentName = searchParams.get('studentName');
  const examType = (searchParams.get('examType') || 'FCE') as ExamType;
  const examId = searchParams.get('examId') || '';

  // Operational states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Active tab state for grading sections
  const [activeSection, setActiveSection] = useState<SectionType>('reading');

  // Unified score state structured exactly as expected by ScoringSheet components
  const [allScores, setAllScores] = useState<Record<SectionType, Record<string, number | null>>>({
    reading: {},
    useOfEnglish: {},
    writing: {},
    listening: {},
    speaking: {}
  });

  // Helper to show streamlined notifications to the teacher
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Pull existing grade records and raw sub-scores from the database on workspace load
  useEffect(() => {
    if (!studentId) return;

    async function loadStudentScores() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('reading_raw, use_of_english_raw, writing_raw, listening_raw, speaking_raw, raw_scores')
        .eq('id', studentId)
        .maybeSingle();

      if (error) {
        showNotification('Failed to load existing student grades.', 'error');
      } else if (data) {
        if (data.raw_scores) {
          // Sync full detailed part-by-part score matrix if it exists
          setAllScores({
            reading: {},
            useOfEnglish: {},
            writing: {},
            listening: {},
            speaking: {},
            ...(data.raw_scores as any)
          });
        }
      }
      setIsLoading(false);
    }

    loadStudentScores();
  }, [studentId]);

  // Dynamic filter for Cambridge advanced tier layout structures
  const sectionsList: SectionType[] = [
    'reading',
    ...(examType === 'FCE' || examType === 'CAE' || examType === 'CPE' ? ['useOfEnglish' as const] : []),
    'writing',
    'listening',
    'speaking'
  ];

  // Helper to calculate total raw score for a given section based on selected part pills
  const getSectionTotalRaw = (sectionScores: Record<string, number | null>) => {
    const values = Object.values(sectionScores).filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return values.reduce((sum, val) => sum + val, 0);
  };

  // State mutation handler passed safely to children components
  const handleScoreChange = (partName: string, value: number | null) => {
    setAllScores(prev => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection],
        [partName]: value
      }
    }));
  };

  // Compute calculated values dynamically for the engine inputs
  const readingRawTotal = getSectionTotalRaw(allScores.reading);
  const useOfEnglishRawTotal = getSectionTotalRaw(allScores.useOfEnglish);
  const writingRawTotal = getSectionTotalRaw(allScores.writing);
  const listeningRawTotal = getSectionTotalRaw(allScores.listening);
  const speakingRawTotal = getSectionTotalRaw(allScores.speaking);

  // Map deep state hooks into the unified structure expected by calculateOverallResults
  const mockInput: StudentExamInput = {
    examType,
    reading: readingRawTotal !== null ? { raw: readingRawTotal, ...allScores.reading } : {},
    useOfEnglish: useOfEnglishRawTotal !== null ? { raw: useOfEnglishRawTotal, ...allScores.useOfEnglish } : {},
    writing: writingRawTotal !== null ? { raw: writingRawTotal, ...allScores.writing } : {},
    listening: listeningRawTotal !== null ? { raw: listeningRawTotal, ...allScores.listening } : {},
    speaking: speakingRawTotal !== null ? { raw: speakingRawTotal, ...allScores.speaking } : {},
  };

  // Run computation engine in real-time to generate CEFR levels, scale scores and status maps
  const computed = calculateOverallResults(mockInput);

  // Handle saving operational scores and status evaluations securely to Supabase
  const handleSaveGrades = async () => {
    if (!studentId) {
      showNotification('Missing student identifier context.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const scoreArray = [readingRawTotal, writingRawTotal, listeningRawTotal, speakingRawTotal];
      if (examType !== 'KET' && examType !== 'PET') {
        scoreArray.push(useOfEnglishRawTotal);
      }

      const filledScoresCount = scoreArray.filter(v => v !== null).length;
      let targetStatus: 'Pending' | 'Partly Graded' | 'Fully Graded' = 'Pending';

      if (filledScoresCount === scoreArray.length) {
        targetStatus = 'Fully Graded';
      } else if (filledScoresCount > 0) {
        targetStatus = 'Partly Graded';
      }

      // Build out data schema payload matching your PostgreSQL relational structure
      const payload = {
        reading_raw: readingRawTotal,
        use_of_english_raw: useOfEnglishRawTotal,
        writing_raw: writingRawTotal,
        listening_raw: listeningRawTotal,
        speaking_raw: speakingRawTotal,
        reading_score: computed.sections?.reading?.cambridgeScaleScore || null,
        use_of_english_score: computed.sections?.useOfEnglish?.cambridgeScaleScore || null,
        writing_score: computed.sections?.writing?.cambridgeScaleScore || null,
        listening_score: computed.sections?.listening?.cambridgeScaleScore || null,
        speaking_score: computed.sections?.speaking?.cambridgeScaleScore || null,
        overall_score: computed.overallScaleScore || null,
        cefr_level: computed.overallCEFR || '-',
        final_grade: computed.overallGrade || '-',
        status: targetStatus,
        raw_scores: allScores // Stores the complete part-by-part break down mapping as JSON
      };

      const { error } = await supabase
        .from('students')
        .update(payload)
        .eq('id', studentId);

      if (error) throw error;

      showNotification('Grades Saved Successfully!');

    } catch (err: any) {
      showNotification(err.message || 'An error occurred while saving grades.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-bold text-slate-500 animate-pulse">Loading candidate record...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* User-Friendly Toast Alert Display */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-black tracking-tight transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}>
          {toast.type === 'success' ? '✓ ' : '✕ '} {toast.message}
        </div>
      )}

      {/* Workspace Header Panel */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-xs">

        {/* router.back() yerine GARANTİ push yöntemi */}
        <button
          onClick={() => router.push(`/?examId=${examId}`)}
          className="text-xs font-black text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          ← Back
        </button>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-black block tracking-wider uppercase">Candidate Workspace</span>
          <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{studentName || 'Unknown Student'}</span>
        </div>
      </header>

      {/* Integrated Assessment Work Area */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Scoring Panel Column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Section Selector Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-200/60 p-1.5 rounded-2xl w-fit">
            {sectionsList.map((sec) => {
              const isActive = activeSection === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setActiveSection(sec)}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all tracking-tight cursor-pointer ${isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {sec === 'useOfEnglish' ? 'Use of English' : sec.charAt(0).toUpperCase() + sec.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Interactive Scoring Input Panel Area */}
          <ScoringSheet
            examType={examType}
            section={activeSection}
            scores={allScores[activeSection]}
            onScoreChange={handleScoreChange}
          />
        </div>

        {/* Real-time Metrics Visualization & Action Area */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Live Performance Analytics Feedback Display Card */}
            <LiveScoreCard examType={examType} result={computed} />

            {/* Save Actions Dashboard Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Actions Workspace</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  Save the input criteria securely. The assessment progression indicators on the roster map will update instantly.
                </p>
              </div>

              {/* Simplified Control Button Interface for Teachers */}
              <button
                onClick={handleSaveGrades}
                disabled={isSaving}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black py-3 rounded-2xl transition-all shadow-md active:scale-97 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSaving ? 'Saving Grades...' : 'Confirm & Save Grades'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-bold text-slate-500 animate-pulse">Initializing evaluation workspace...</p>
      </div>
    }>
      <AssessmentContent />
    </Suspense>
  );
}