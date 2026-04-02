
import React from 'react';
import { GameEvent } from '../types';

interface PerformanceSummaryProps {
  events: GameEvent[];
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({ events }) => {
  const userEvents = events.filter(e => (e.userEarned || 0) !== 0);
  
  const stats = {
    goals: userEvents.filter(e => e.type === 'GOAL').length,
    assists: userEvents.filter(e => e.type === 'ASSIST').length,
    saves: userEvents.filter(e => e.type === 'SAVE').length,
    grit: userEvents.filter(e => ['HIT', 'BLOCKED_SHOT', 'TAKEAWAY'].includes(e.type)).length,
    points: userEvents.reduce((acc, curr) => acc + (curr.userEarned || 0), 0)
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">User Performance Summary</h3>
        <div className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase">
          Career Stats
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col items-center p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <div className="text-red-500 mb-1"><i className="fa-solid fa-fire text-lg"></i></div>
          <div className="text-2xl font-black oswald text-white">{stats.goals}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase">Goals Picked</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <div className="text-blue-400 mb-1"><i className="fa-solid fa-hands-helping text-lg"></i></div>
          <div className="text-2xl font-black oswald text-white">{stats.assists}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase">Assists Found</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <div className="text-green-400 mb-1"><i className="fa-solid fa-shield-halved text-lg"></i></div>
          <div className="text-2xl font-black oswald text-white">{stats.saves}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase">Wall Mode</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <div className="text-amber-600 mb-1"><i className="fa-solid fa-gavel text-lg"></i></div>
          <div className="text-2xl font-black oswald text-white">{stats.grit}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase">Grit Plays</div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Accuracy: {events.length ? Math.round((userEvents.length / events.length) * 100) : 0}% of live plays matched your picks</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 italic">"Puck luck favors the bold"</div>
      </div>
    </div>
  );
};

export default PerformanceSummary;
