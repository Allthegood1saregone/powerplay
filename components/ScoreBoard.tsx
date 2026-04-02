import React from 'react';
import { TeamInfo, OnIceStrength } from '../types';

interface ScoreBoardProps {
  home: TeamInfo;
  away: TeamInfo;
  period: number;
  time: string;
  strength: OnIceStrength;
  isRealTimeSync?: boolean;
  status?: string;
  isPowerPlay?: boolean;
  penaltyClocks?: {
    team: 'home' | 'away';
    time: string;
    player?: string;
  }[];
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ home, away, period, time, strength, isRealTimeSync, status, isPowerPlay, penaltyClocks }) => {
  return (
    <div className={`bg-slate-900 border-b border-slate-700 p-4 sticky top-0 z-50 shadow-2xl transition-all duration-500 ${isPowerPlay ? 'ring-2 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : ''}`}>
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex items-center gap-4 flex-1">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{away.city}</div>
              <div className="text-xl font-black oswald uppercase">{away.name}</div>
            </div>
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-slate-700 overflow-hidden bg-white"
                style={{ borderColor: away.color }}
              >
                {away.logoUrl ? (
                  <img src={away.logoUrl} alt={away.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  away.logo
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-800 text-[8px] font-black oswald px-1 rounded border border-slate-700 text-white">
                {away.abbreviation}
              </div>
            </div>
            <div className="text-4xl font-black oswald min-w-[3rem] text-center">{away.score}</div>
          </div>

          {/* Center Clock */}
          <div className="flex flex-col items-center px-8 border-x border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <div className={`text-[8px] font-black uppercase border px-1 rounded ${status?.toLowerCase() === 'live' ? 'text-red-500 border-red-500/30 animate-pulse' : 'text-slate-500 border-slate-700'}`}>
                {status || 'Live'}
              </div>
              {isRealTimeSync && (
                <div className="text-[8px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                  <i className="fa-solid fa-satellite-dish text-[7px] animate-pulse"></i>
                  Grounding
                </div>
              )}
              {(strength !== '5v5' || isPowerPlay) && (
                <div className={`text-[8px] font-black ${isPowerPlay ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-slate-950'} px-1.5 rounded uppercase tracking-tighter flex items-center gap-1`}>
                  {isPowerPlay && <i className="fa-solid fa-bolt text-[7px]"></i>}
                  {isPowerPlay ? 'POWERPLAY' : strength === 'PP' ? 'Powerplay' : strength === 'PK' ? 'Penalty Kill' : strength}
                </div>
              )}
            </div>
            <div className="text-3xl font-mono font-bold tracking-tighter text-white">{time}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
              {period === 1 ? '1st Period' : period === 2 ? '2nd Period' : period === 3 ? '3rd Period' : period === 4 ? 'Overtime' : 'Shootout'}
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="text-4xl font-black oswald min-w-[3rem] text-center">{home.score}</div>
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-slate-700 overflow-hidden bg-white"
                style={{ borderColor: home.color }}
              >
                {home.logoUrl ? (
                  <img src={home.logoUrl} alt={home.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  home.logo
                )}
              </div>
              <div className="absolute -bottom-1 -left-1 bg-slate-800 text-[8px] font-black oswald px-1 rounded border border-slate-700 text-white">
                {home.abbreviation}
              </div>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{home.city}</div>
              <div className="text-xl font-black oswald uppercase">{home.name}</div>
            </div>
          </div>
        </div>

        {/* Penalty Clocks */}
        {penaltyClocks && penaltyClocks.length > 0 && (
          <div className="flex justify-center gap-4 mt-1">
            {penaltyClocks.map((penalty, idx) => (
              <div key={`penalty-${idx}`} className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white animate-in fade-in slide-in-from-top-1">
                <span className={`w-1.5 h-1.5 rounded-full ${penalty.team === 'home' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                <span className="text-slate-400">{penalty.team === 'home' ? home.abbreviation : away.abbreviation}</span>
                {penalty.player && <span className="text-slate-200">{penalty.player}</span>}
                <span className="text-red-500 font-mono">{penalty.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreBoard;