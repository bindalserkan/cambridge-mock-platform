import { 
  ExamType, 
  StudentExamInput, 
  OverallExamResult, 
  RawSectionScores 
} from './types';
import { KET_CONFIG } from './ketConfig';
import { PET_CONFIG } from './petConfig';
import { FCE_CONFIG } from './fceConfig';
import { CAE_CONFIG } from './caeConfig';
import { CPE_CONFIG } from './cpeConfig';
import { SCALE_MAPPINGS, getCEFRLevel, getGrade } from './mappings';

/**
 * Resolves the Cambridge Scale Score by searching the matrix inside mappings.ts using the raw point sum.
 */
function mapRawToScale(examType: ExamType, sectionName: string, rawScore: number): number {
  const examMap = SCALE_MAPPINGS[examType];
  if (!examMap) return 0;

  const sectionMap = examMap[sectionName];
  if (!sectionMap) return 0;

  return sectionMap[rawScore] ?? 0;
}

/**
 * Processes a single exam section, calculates total raw scores, and determines section completion status.
 */
function processSection(
  examType: ExamType,
  sectionName: string,
  rawScores: RawSectionScores
): { practiceTestScore: number; isComplete: boolean } {
  
  // Guard configuration mapping based on the active exam type
  let fields = [];
  if (examType === 'KET') fields = KET_CONFIG[sectionName] || [];
  else if (examType === 'PET') fields = PET_CONFIG[sectionName] || [];
  else if (examType === 'FCE') fields = FCE_CONFIG[sectionName] || [];
  else if (examType === 'CAE') fields = CAE_CONFIG[sectionName] || [];
  else if (examType === 'CPE') fields = CPE_CONFIG[sectionName] || [];

  if (
    examType === 'KET' || 
    examType === 'PET' || 
    examType === 'FCE' || 
    examType === 'CAE' || 
    examType === 'CPE'
  ) {
    if (fields.length === 0) return { practiceTestScore: 0, isComplete: false };

    let total = 0;
    let isComplete = true;

    for (const field of fields) {
      const val = rawScores[field.key];
      if (val === undefined || val === null) {
        isComplete = false;
      } else {
        // Evaluate specific weighting conditions based on exam and section definitions
        if (examType === 'CPE') {
          if (sectionName === 'reading') {
            // CPE Reading weights: Part 5 and Part 6 scale by 2, others by 1
            total += (field.key === 'Part 5' || field.key === 'Part 6') ? val * 2 : val;
          } else if (sectionName === 'useOfEnglish') {
            // CPE Use of English weights: Part 4 Correct scales by 2, Partly Correct by 1
            total += field.key === 'Part 4 - Correct Answers' ? val * 2 : val;
          } else if (sectionName === 'speaking') {
            // CPE Speaking weights: Global Achievement scales by 5, other 5 criteria scale by 2
            total += field.key === 'Global Achievement' ? val * 5 : val * 2;
          } else {
            total += val;
          }
        } else if (examType === 'CAE') {
          if (sectionName === 'reading') {
            // CAE Reading weights: Parts 5, 6, and 7 scale by 2, others by 1
            const isDoubleWeight = field.key === 'Part 5' || field.key === 'Part 6' || field.key === 'Part 7';
            total += isDoubleWeight ? val * 2 : val;
          } else if (sectionName === 'useOfEnglish') {
            // CAE Use of English weights: Part 4 Correct scales by 2, Partly Correct by 1
            total += field.key === 'Part 4 - Correct Answers' ? val * 2 : val;
          } else if (sectionName === 'speaking') {
            // CAE Speaking weights: Global Achievement scales by 5, all other 5 criteria scale by 2
            total += field.key === 'Global Achievement' ? val * 5 : val * 2;
          } else {
            total += val;
          }
        } else if (examType === 'FCE') {
          if (sectionName === 'reading') {
            total += (field.key === 'Part 5' || field.key === 'Part 6') ? val * 2 : val;
          } else if (sectionName === 'useOfEnglish') {
            total += field.key === 'Part 4 - Correct Answers' ? val * 2 : val;
          } else if (sectionName === 'speaking') {
            total += field.key === 'Global Achievement' ? val * 4 : val * 2;
          } else {
            total += val;
          }
        } else if (examType === 'PET' && sectionName === 'speaking') {
          total += field.key === 'Global Achievement' ? val * 2 : val;
        } else if (examType === 'KET' && sectionName === 'speaking') {
          total += field.key === 'Global Achievement' ? val * 3 : val * 2;
        } else {
          total += val;
        }
      }
    }

    return { practiceTestScore: total, isComplete };
  }

  // Fallback system for generic fallback paths
  const values = Object.values(rawScores);
  if (values.length === 0) return { practiceTestScore: 0, isComplete: false };

  const practiceTestScore = values.reduce<number>((sum, val) => sum + (val ?? 0), 0);
  const isComplete = values.every(val => val !== null && val !== undefined);

  return { practiceTestScore, isComplete };
}

/**
 * Main calculation entry point that reactively evaluates all sections and builds the global state payload.
 */
export function calculateOverallResults(input: StudentExamInput): OverallExamResult {
  const { examType } = input;
  
  const sectionsToProcess = ['reading', 'listening', 'writing', 'speaking'];
  if (['FCE', 'CAE', 'CPE'].includes(examType)) {
    sectionsToProcess.push('useOfEnglish');
  }

  const sectionsResult: OverallExamResult['sections'] = {};
  let totalScaleScore = 0;
  let completedSectionsCount = 0;
  let isFullyGraded = true;

  for (const section of sectionsToProcess) {
    const sectionScores = input[section as keyof StudentExamInput] as RawSectionScores || {};
    const { practiceTestScore, isComplete } = processSection(examType, section, sectionScores);

    const cambridgeScaleScore = isComplete ? mapRawToScale(examType, section, practiceTestScore) : 0;
    const cefrLevel = isComplete ? getCEFRLevel(examType, cambridgeScaleScore) : '-';

    sectionsResult[section] = {
      practiceTestScore,
      cambridgeScaleScore,
      cefrLevel,
      isComplete,
    };

    if (isComplete) {
      totalScaleScore += cambridgeScaleScore;
      completedSectionsCount++;
    } else {
      isFullyGraded = false;
    }
  }

  // Standard mathematical rounding fixes fractional score clipping
  const overallScaleScore = completedSectionsCount > 0 
    ? Math.round(totalScaleScore / completedSectionsCount) 
    : 0;

  const overallCEFR = isFullyGraded ? getCEFRLevel(examType, overallScaleScore) : '-';
  const overallGrade = isFullyGraded ? getGrade(examType, overallScaleScore) : '-';

  return {
    examType,
    sections: sectionsResult,
    overallScaleScore,
    overallCEFR,
    overallGrade,
    isFullyGraded,
  };
}