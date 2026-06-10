export type ExamType = 'KET' | 'PET' | 'FCE' | 'CAE' | 'CPE';
export type CEFRLevel = '-' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ExamGrade = 'A' | 'B' | 'C' | '-';

// Flexible structure to hold raw scores for any part (questions or criteria)
// Initial values will be null (Not Selected) instead of 0 to avoid the "0 Nightmare"
export interface RawSectionScores {
  [partName: string]: number | null; 
}

export interface StudentExamInput {
  examType: ExamType;
  reading?: RawSectionScores;
  listening?: RawSectionScores;
  writing?: RawSectionScores;
  speaking?: RawSectionScores;
  useOfEnglish?: RawSectionScores; // Used for FCE, CAE, CPE
}

export interface SectionResult {
  practiceTestScore: number | null;
  cambridgeScaleScore: number | null;
  cefrLevel: CEFRLevel;
  grade: ExamGrade;
  isComplete: boolean;
}

export interface OverallExamResult {
  sections: {
    reading: SectionResult;
    listening: SectionResult;
    writing: SectionResult;
    speaking: SectionResult;
    useOfEnglish?: SectionResult;
  };
  overallScaleScore: number | null;
  overallCEFR: CEFRLevel;
  overallGrade: ExamGrade;
  isFullyGraded: boolean;
}