'use client';

import React from 'react';
import { OverallExamResult, ExamType } from '@/lib/examEngine/types';

interface LiveScoreCardProps {
  examType: ExamType;
  result: OverallExamResult;
}

export const LiveScoreCard = ({ examType, result }: LiveScoreCardProps) => {
  const { sections, overallScaleScore, overallCEFR, overallGrade, isFullyGraded } = result;

  const getCEFRColor = (level: string) => {
    if (level === '-') return 'bg-slate-800 text-slate-400';
    if (['C1', 'C2'].includes(level)) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (['B1', 'B2'].includes(level)) return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  const activeSections = Object.entries(sections).filter(([name]) => {
    if (name === 'useOfEnglish' && !['FCE', 'CAE', 'CPE'].includes(examType)) return false;
    return true;
  });

  const completedCount = activeSections.filter(([_, data]) => data.isComplete).length;
  const totalCount = activeSections.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between h-full gap-6 sticky top-24">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Live Performance</h3>
          <span className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded-full text-slate-300">
            {completedCount} / {totalCount} Sections Graded
          </span>
        </div>

        {isFullyGraded ? (
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-4 text-center shadow-lg shadow-indigo-500/5 transition-all animate-in zoom-in-95 duration-200">
            <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase">Overall Scale Score</p>
            <h2 className="text-5xl font-black text-white my-2 tracking-tight">{overallScaleScore}</h2>
            <div className="flex justify-center gap-2 mt-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${getCEFRColor(overallCEFR)}`}>
                CEFR: {overallCEFR}
              </span>
              {overallGrade !== '-' && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Grade: {overallGrade}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/10 border border-slate-800 border-dashed rounded-xl p-6 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Awaiting Dataset...</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Fill all components to run final performance certifications.</p>
          </div>
        )}
      </div>

      <div className="space-y-2 flex-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Component Breakdown</h4>
        
        {activeSections.map(([name, data]) => (
          <div 
            key={name} 
            className={`p-3 rounded-xl border transition-all ${
              data.isComplete 
                ? 'bg-slate-800/40 border-slate-800 shadow-sm' 
                : 'bg-slate-950/20 border-slate-900/50 opacity-40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white capitalize tracking-wide block">
                  {name === 'useOfEnglish' ? 'Use of English' : name}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  Raw Points Matrix: <span className="font-bold text-slate-400">{data.isComplete ? data.practiceTestScore : '-'}</span>
                </span>
              </div>
              
              {data.isComplete ? (
                <div className="text-right">
                  <div className="text-xs font-black text-indigo-400">Scale: {data.cambridgeScaleScore}</div>
                  <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded mt-1 uppercase ${getCEFRColor(data.cefrLevel)}`}>
                    {data.cefrLevel}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-950/40 px-2 py-0.5 rounded">
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};