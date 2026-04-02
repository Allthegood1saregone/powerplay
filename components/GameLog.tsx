
import React, { useState } from 'react';
import { GameEvent, TeamInfo } from '../types';

interface GameLogProps {
  events: GameEvent[];
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}

const GameLog: React.FC<GameLogProps> = ({ events, homeTeam, awayTeam }) => {
  const [filterKeyPlays, setFilterKeyPlays] = useState(false);

  if (events.length === 0) return null;

  const displayEvents = filterKeyPlays 
    ? events.filter(e => e.type === 'GOAL' || e.type === 'SAVE' || (e.userEarned || 0) >= 1000)
    : events;

  // Group events by period
  const periods = [3, 2, 1].filter(p => displayEvents.some(e => e.period === p));

  const getEventIcon = (type: GameEvent['type']) => {
    switch (type) {
      case 'GOAL': return <i className="fa-solid fa-bullseye text-red-500"></i>;
      case 'SAVE': return <i className="fa-solid fa-shield-halved text-blue-400"></i>;
      case 'HIT': return <i className="fa-solid fa-burst text-amber-600"></i>;
      case 'SHOT': return <i className="fa-solid fa-circle-dot text-slate-400"></i>;
      case 'GOAL_AGAINST': return <i className="fa-solid fa-circle-xmark text-red-700"></i>;
      default: return <i className="fa-solid fa-hockey-puck text-slate-500"></i>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black oswald uppercase tracking-wider flex items-center gap-2">
          <i className="fa-solid fa-list-ul text-blue-500"></i>
          Detailed Game Log
        </h2>
        
        <button 
          onClick={() => setFilterKeyPlays(!filterKeyPlays)}
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
            filterKeyPlays 
            ? 'bg-amber-500 text-slate-950 border-amber-400' 
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {filterKeyPlays ? 'Showing Highlights' : 'Show Highlights Only'}
        </button>
      </div>

      <div className="space-y-8">
        {periods.map(period => (
          <div key={`period-log-${period}`} className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-700">
                {period === 1 ? '1st Period' : period === 2 ? '2nd Period' : period === 3 ? '3rd Period' : 'Overtime'}
              </div>
              <div className="h-[1px] flex-1 bg-slate-800"></div>
            </div>

            <div className="space-y-3">
              {displayEvents
                .filter(e => e.period === period)
                .map((event, idx) => {
                  const isUserPositive = (event.userEarned || 0) > 0;
                  const isUserNegative = (event.userEarned || 0) < 0;
                  const isGoal = event.type === 'GOAL';

                  return (
                    <div 
                      key={`${event.id}-${idx}`}
                      className={`group flex items-center gap-4 border rounded-xl p-3 transition-all ${
                        isGoal 
                        ? 'bg-red-900/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/50'
                      }`}
                    >
                      {/* Time & Score Snapshot */}
                      <div className="flex flex-col items-center min-w-[50px] border-r border-slate-800/50 pr-4">
                        <span className="text-[10px] font-mono text-slate-500">{event.gameTime}</span>
                        <span className={`text-xs font-black ${isGoal ? 'text-red-400' : 'text-slate-300'}`}>
                          {event.awayScoreAtEvent}-{event.homeScoreAtEvent}
                        </span>
                      </div>

                      {/* Event Detail */}
                      <div className="flex-1 flex items-center gap-3">
                        <div className={`text-lg transition-opacity ${isGoal ? 'animate-pulse' : 'opacity-80 group-hover:opacity-100'}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex flex-col">
                          <div className="text-[11px] font-bold uppercase tracking-tight flex items-center gap-1.5">
                            <span className={event.team === 'home' ? 'text-blue-400' : 'text-amber-400'}>
                              {event.team === 'home' ? homeTeam.name : awayTeam.name}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">{event.position}</span>
                          </div>
                          <p className={`text-xs leading-tight ${isGoal ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>
                            {event.description}
                          </p>
                        </div>
                      </div>

                      {/* Points Impact */}
                      {event.userEarned !== 0 && (
                        <div className="flex flex-col items-end min-w-[70px]">
                          <div className={`text-xs font-black oswald ${isUserPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isUserPositive ? '+' : ''}{event.userEarned}
                          </div>
                          <div className="text-[8px] font-bold text-slate-600 uppercase">Points</div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameLog;
