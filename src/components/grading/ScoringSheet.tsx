'use client';

import React from 'react';
import { ExamType, RawSectionScores } from '@/lib/examEngine/types';
import { KET_CONFIG } from '@/lib/examEngine/ketConfig';
import { PET_CONFIG } from '@/lib/examEngine/petConfig';
import { FCE_CONFIG } from '@/lib/examEngine/fceConfig';
import { CAE_CONFIG } from '@/lib/examEngine/caeConfig';
import { CPE_CONFIG } from '@/lib/examEngine/cpeConfig';

interface ScoringSheetProps {
  examType: ExamType;
  section: 'reading' | 'listening' | 'writing' | 'speaking' | 'useOfEnglish';
  scores: RawSectionScores;
  onScoreChange: (partName: string, value: number | null) => void;
}

const CONFIG_MAP = {
  KET: KET_CONFIG,
  PET: PET_CONFIG,
  FCE: FCE_CONFIG,
  CAE: CAE_CONFIG,
  CPE: CPE_CONFIG,
};

const generateScoreOptions = (max: number, step: number): number[] => {
  const options: number[] = [];
  for (let i = 0; i <= max; i += step) {
    options.push(i);
  }
  return options;
};

const formatSectionHeader = (sec: string): string => {
  if (sec === 'useOfEnglish') return 'Use of English';
  return sec.charAt(0).toUpperCase() + sec.slice(1);
};

export const ScoringSheet = ({
  examType,
  section,
  scores = {}, // Safe fallback assignment to prevent object property runtime reference crashes
  onScoreChange,
}: ScoringSheetProps) => {

  const currentSectionFields = CONFIG_MAP[examType]?.[section] || [];

  if (!CONFIG_MAP[examType]) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        {examType} configuration will be added in subsequent implementation phases. 
        Please choose an active level to run system tests.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-lg font-bold text-white tracking-wide">
          {examType} {formatSectionHeader(section)} Assessment
        </h3>
      </div>

      <div className="space-y-4">
        {currentSectionFields.map((field) => {
          const options = generateScoreOptions(field.max, field.step);
          const currentValue = scores[field.key];

          return (
            <div 
              key={field.key} 
              className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-800/30 border border-slate-800/80 rounded-xl gap-4 transition-all hover:border-slate-700/50"
            >
              <div className="flex flex-col min-w-[240px]">
                <span className="text-sm font-bold text-slate-200 tracking-wide">
                  {field.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-w-full md:max-w-md lg:max-w-xl">
                {options.map((option) => {
                  const isSelected = currentValue === option;
                  
                  // Verification engine for advanced tiers Use of English Part 4 boundary compliance
                  let isDisabled = false;
                  if (
                    (examType === 'FCE' || examType === 'CAE' || examType === 'CPE') && 
                    section === 'useOfEnglish'
                  ) {
                    if (field.key === 'Part 4 - Correct Answers') {
                      const companionVal = scores['Part 4 - Partly Correct Answers'] ?? 0;
                      if (option + companionVal > 6) isDisabled = true;
                    }
                    if (field.key === 'Part 4 - Partly Correct Answers') {
                      const companionVal = scores['Part 4 - Correct Answers'] ?? 0;
                      if (option + companionVal > 6) isDisabled = true;
                    }
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => onScoreChange(field.key, isSelected ? null : option)}
                      className={`h-9 px-3 text-xs font-bold rounded-lg border transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10 transform scale-105'
                          : isDisabled
                            ? 'bg-slate-950 text-slate-700 border-slate-900 cursor-not-allowed opacity-20'
                            : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-700/50'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};