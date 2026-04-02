
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Position, TeamInfo, FloatingPoint, GameEvent } from '../types';
import { POSITIONS, PLAYER_DATA } from '../constants';

interface PickStatusProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  userPicks: { home: Position | null; away: Position | null; homeNumber: number | null; awayNumber: number | null };
  floatingPoints: FloatingPoint[];
  isSelecting: boolean;
  onConfirmPicks: (picks: { home: Position; away: Position; homeNumber: number; awayNumber: number }) => void;
  puckPossession?: { team: 'home' | 'away'; position: Position } | null;
  events: GameEvent[]; // Added events to calculate points
}

const PickStatus: React.FC<PickStatusProps> = ({ 
  homeTeam, 
  awayTeam, 
  userPicks, 
  floatingPoints, 
  isSelecting,
  onConfirmPicks,
  puckPossession,
  events
}) => {
  const [draftAway, setDraftAway] = useState<Position | null>(userPicks.away);
  const [draftHome, setDraftHome] = useState<Position | null>(userPicks.home);
  const [possessionFlash, setPossessionFlash] = useState<{ team: 'home' | 'away'; position: Position } | null>(null);
  const prevPossessionRef = useRef<{ team: 'home' | 'away'; position: Position } | null>(null);

  const numbers = useMemo(() => {
    const res: Record<string, number> = {};
    POSITIONS.forEach(p => {
      res[`away-${p.value}`] = Math.floor(Math.random() * 98) + 1;
      res[`home-${p.value}`] = Math.floor(Math.random() * 98) + 1;
    });
    return res;
  }, []);

  // Calculate points earned with the currently active picks
  const earnedPoints = useMemo(() => {
    const homePoints = events
      .filter(e => e.team === 'home' && e.position === userPicks.home && e.userEarned)
      .reduce((sum, e) => sum + (e.userEarned || 0), 0);
    
    const awayPoints = events
      .filter(e => e.team === 'away' && e.position === userPicks.away && e.userEarned)
      .reduce((sum, e) => sum + (e.userEarned || 0), 0);

    return { home: homePoints, away: awayPoints };
  }, [events, userPicks.home, userPicks.away]);

  useEffect(() => {
    if (puckPossession && (
      puckPossession.team !== prevPossessionRef.current?.team || 
      puckPossession.position !== prevPossessionRef.current?.position
    )) {
      setPossessionFlash({ team: puckPossession.team, position: puckPossession.position });
      setTimeout(() => setPossessionFlash(null), 1500);
    }
    prevPossessionRef.current = puckPossession || null;
  }, [puckPossession]);

  const handleConfirm = () => {
    if (draftAway && draftHome) {
      onConfirmPicks({
        away: draftAway,
        home: draftHome,
        awayNumber: numbers[`away-${draftAway}`],
        homeNumber: numbers[`home-${draftHome}`]
      });
    }
  };

  const getPosCoords = (pos: Position, isHome: boolean) => {
    const baseCoords: Record<Position, { top: string; left: string }> = {
      'G': { top: '50%', left: isHome ? '92%' : '8%' },
      'LD': { top: '30%', left: isHome ? '75%' : '25%' },
      'RD': { top: '70%', left: isHome ? '75%' : '25%' },
      'LW': { top: '22%', left: isHome ? '60%' : '40%' },
      'RW': { top: '78%', left: isHome ? '60%' : '40%' },
      'C': { top: '50%', left: isHome ? '60%' : '40%' },
    };
    return baseCoords[pos];
  };

  const getPointBadgePosition = (left: string) => {
    const l = parseFloat(left);
    return l > 50 ? 'right-[115%]' : 'left-[115%]';
  };

  const getPlayerName = (teamName: string, pos: Position | null, num: number | null) => {
    if (!pos || num === null) return 'Not Selected';
    const player = PLAYER_DATA[teamName]?.[pos]?.find(p => p.jerseyNumber === num);
    return player ? player.name : `${pos} Active`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tactical Rink */}
      <div className={`relative w-full aspect-[1.5/1] bg-white rounded-[40px] border-[4px] overflow-visible shadow-2xl transition-all duration-500 ${isSelecting ? 'border-blue-500/50' : 'border-slate-300'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.3)_0%,transparent_100%)] rounded-[36px] overflow-hidden pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.05)_1px,transparent_1px)] bg-[size:10px_10px] rounded-[36px] overflow-hidden pointer-events-none"></div>
        
        <div className="absolute inset-y-0 left-[6%] w-0.5 bg-red-600/40 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-[6%] w-0.5 bg-red-600/40 pointer-events-none"></div>
        <div className="absolute inset-y-0 left-1/2 w-1 bg-red-600/60 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-red-600 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <div className="absolute inset-y-0 left-[35%] w-1.5 bg-blue-600/50 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-[35%] w-1.5 bg-blue-600/50 pointer-events-none"></div>

        <div className="absolute top-2 left-4 oswald font-black text-slate-300 text-[10px] uppercase pointer-events-none">{awayTeam.name}</div>
        <div className="absolute top-2 right-4 oswald font-black text-slate-300 text-[10px] uppercase text-right pointer-events-none">{homeTeam.name}</div>

        {['away', 'home'].map((side) => 
          POSITIONS.map((p) => {
            const isHomeSide = side === 'home';
            const coords = getPosCoords(p.value, isHomeSide);
            const isDrafted = isHomeSide ? draftHome === p.value : draftAway === p.value;
            const isConfirmed = isHomeSide ? userPicks.home === p.value : userPicks.away === p.value;
            const isSelected = isSelecting ? isDrafted : isConfirmed;
            
            const hasPuck = puckPossession?.team === side && puckPossession?.position === p.value;
            const isFlashing = possessionFlash?.team === side && possessionFlash?.position === p.value;
            const relevantPoints = floatingPoints.filter(fp => fp.team === side && fp.position === p.value);
            
            return (
              <div
                key={`sidebar-rink-${side}-${p.value}`}
                style={{ top: coords.top, left: coords.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center overflow-visible"
              >
                <button
                  disabled={!isSelecting}
                  onClick={() => isSelecting && (isHomeSide ? setDraftHome(p.value) : setDraftAway(p.value))}
                  className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex flex-col items-center justify-center transition-all border-2 shadow-sm ${
                    hasPuck 
                      ? 'bg-green-500 border-white scale-125 ring-4 ring-green-400/50 z-30 animate-puck-carrier'
                      : isSelected 
                        ? (isHomeSide ? 'bg-blue-600 border-white scale-110 shadow-lg ring-2 ring-blue-400/30' : 'bg-amber-500 border-white scale-110 shadow-lg ring-2 ring-amber-400/30 text-slate-950') 
                        : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'
                  } ${isSelecting ? 'cursor-pointer' : 'cursor-not-allowed opacity-60 grayscale-[0.5]'} ${isFlashing ? 'animate-flash-green' : ''}`}
                >
                  <span className="text-[8px] font-black oswald leading-none">{p.value}</span>
                  {isSelected && (
                    <span className="text-[5px] font-bold opacity-80 leading-tight">
                      #{isSelecting ? (numbers[`${side}-${p.value}`] || '??') : (isHomeSide ? userPicks.homeNumber : userPicks.awayNumber)}
                    </span>
                  )}
                  {hasPuck && <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-black rounded-full border border-white flex items-center justify-center text-[5px] text-white font-bold">P</div>}
                </button>

                {relevantPoints.map(fp => (
                  <div 
                    key={`tactical-badge-${fp.id}`}
                    className={`absolute pointer-events-none z-[60] font-black oswald text-[9px] px-1.5 py-0.5 rounded-full border-2 shadow-lg animate-tactical-pop flex items-center gap-1 ${fp.points > 0 ? 'bg-green-500 border-green-200 text-white' : 'bg-red-500 border-red-200 text-white'} ${getPointBadgePosition(coords.left)}`}
                    style={{ 
                      boxShadow: `0 0 15px ${fp.points > 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'}` 
                    }}
                  >
                    <i className={`fa-solid ${fp.points > 0 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                    {fp.points > 0 ? '+' : ''}{fp.points}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-3">
        {isSelecting ? (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block">Away</span>
                <span className="text-sm font-black oswald text-amber-500">{draftAway || '---'}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block">Home</span>
                <span className="text-sm font-black oswald text-blue-400">{draftHome || '---'}</span>
              </div>
            </div>
            <button 
              onClick={handleConfirm} 
              disabled={!draftAway || !draftHome}
              className={`w-full py-3.5 rounded-xl font-black oswald text-lg uppercase tracking-widest transition-all ${draftAway && draftHome ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 active:scale-95' : 'bg-slate-800 text-slate-600'}`}
            >
              Lock POWERPLAY
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-300">
            {/* Away Command Card */}
            <div className={`rounded-xl p-3 border transition-all flex items-center gap-3 relative overflow-hidden ${puckPossession?.team === 'away' ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-900 border-slate-800'}`}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex flex-col items-center justify-center font-black oswald text-lg border border-white/10 shadow-inner overflow-hidden" style={{ backgroundColor: awayTeam.color }}>
                 {awayTeam.logoUrl ? (
                   <img src={awayTeam.logoUrl} alt={awayTeam.name} className="w-full h-full object-contain bg-white p-1" referrerPolicy="no-referrer" />
                 ) : (
                   <>
                     <span className="text-[10px] text-white/70 leading-none mb-0.5">#{userPicks.awayNumber}</span>
                     <span className="text-white leading-none">{userPicks.away}</span>
                   </>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 flex items-center justify-between">
                  Away Deployment
                  {puckPossession?.team === 'away' && <span className="text-[7px] bg-green-500 text-white px-1 rounded-sm animate-pulse">ON PUCK</span>}
                </div>
                <div className="text-xs font-black text-white oswald italic truncate uppercase">{getPlayerName(awayTeam.name, userPicks.away, userPicks.awayNumber)}</div>
              </div>
              <div className="text-right border-l border-white/5 pl-3">
                <div className="text-[7px] font-black text-slate-500 uppercase mb-0.5">Points</div>
                <div className={`text-sm font-black oswald ${earnedPoints.away > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                  {earnedPoints.away.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Home Command Card */}
            <div className={`rounded-xl p-3 border transition-all flex items-center gap-3 relative overflow-hidden ${puckPossession?.team === 'home' ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-900 border-slate-800'}`}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex flex-col items-center justify-center font-black oswald text-lg border border-white/10 shadow-inner overflow-hidden" style={{ backgroundColor: homeTeam.color }}>
                 {homeTeam.logoUrl ? (
                   <img src={homeTeam.logoUrl} alt={homeTeam.name} className="w-full h-full object-contain bg-white p-1" referrerPolicy="no-referrer" />
                 ) : (
                   <>
                     <span className="text-[10px] text-white/70 leading-none mb-0.5">#{userPicks.homeNumber}</span>
                     <span className="text-white leading-none">{userPicks.home}</span>
                   </>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 flex items-center justify-between">
                  Home Deployment
                  {puckPossession?.team === 'home' && <span className="text-[7px] bg-green-500 text-white px-1 rounded-sm animate-pulse">ON PUCK</span>}
                </div>
                <div className="text-xs font-black text-white oswald italic truncate uppercase">{getPlayerName(homeTeam.name, userPicks.home, userPicks.homeNumber)}</div>
              </div>
              <div className="text-right border-l border-white/5 pl-3">
                <div className="text-[7px] font-black text-slate-500 uppercase mb-0.5">Points</div>
                <div className={`text-sm font-black oswald ${earnedPoints.home > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                  {earnedPoints.home.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes tactical-pop {
          0% { transform: scale(0) translateX(10px); opacity: 0; filter: blur(4px); }
          20% { transform: scale(1.3) translateX(0); opacity: 1; filter: blur(0); }
          40% { transform: scale(1); }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8) translateY(-20px); opacity: 0; filter: blur(8px); }
        }
        @keyframes puck-carrier-glow {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(34, 197, 94, 0.6); border-color: rgba(34, 197, 94, 0.4); border-width: 2px; }
          50% { box-shadow: 0 0 24px 8px rgba(34, 197, 94, 0.9); border-color: rgba(34, 197, 94, 1); border-width: 4px; }
        }
        @keyframes flash-green {
          0%, 100% { border-color: transparent; border-width: 2px; transform: scale(1); }
          50% { border-color: #22c55e; border-width: 8px; transform: scale(1.3); box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
        }
        .animate-tactical-pop { animation: tactical-pop 2.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-puck-carrier { animation: puck-carrier-glow 1.5s infinite ease-in-out; }
        .animate-flash-green { animation: flash-green 0.5s ease-in-out 3; }
      `}</style>
    </div>
  );
};

export default PickStatus;
