import React, { useState, useEffect, useRef } from 'react';
import { Position, TeamInfo, GameEvent, FloatingPoint, OnIceStrength } from '../types';
import { POSITIONS, PLAYER_DATA } from '../constants';

interface SelectionOverlayProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  onConfirm: (picks: { home: Position; away: Position; homeNumber: number; awayNumber: number }) => void;
  events: GameEvent[];
  puckPossession?: { team: 'home' | 'away'; position: Position } | null;
  floatingPoints?: FloatingPoint[];
  strength: OnIceStrength;
  isPowerPlay?: boolean;
  waitingReason?: string;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ homeTeam, awayTeam, onConfirm, events, puckPossession, floatingPoints, strength, isPowerPlay, waitingReason }) => {
  const [awayPick, setAwayPick] = useState<Position | null>(null);
  const [homePick, setHomePick] = useState<Position | null>(null);
  const [awayNum, setAwayNum] = useState<number | null>(null);
  const [homeNum, setHomeNum] = useState<number | null>(null);
  
  const [possessionFlashTeam, setPossessionFlashTeam] = useState<'home' | 'away' | null>(null);
  
  const [hovered, setHovered] = useState<{ side: 'home' | 'away'; pos: Position } | null>(null);
  const [flash, setFlash] = useState<{ side: 'home' | 'away'; pos: Position; type: 'green' | 'red' | 'possession' } | null>(null);
  const prevPossessionRef = useRef<{ team: 'home' | 'away'; position: Position } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-confirm when both are selected
  useEffect(() => {
    if (awayPick && homePick && awayNum !== null && homeNum !== null) {
      const timer = setTimeout(() => {
        onConfirm({ 
          home: homePick, 
          away: awayPick, 
          homeNumber: homeNum, 
          awayNumber: awayNum 
        });
      }, 300); // Snappy auto-confirm
      return () => clearTimeout(timer);
    }
  }, [awayPick, homePick, awayNum, homeNum, onConfirm]);

  const triggerFlash = (side: 'home' | 'away', pos: Position, type: 'green' | 'red' | 'possession', duration = 1500) => {
    setFlash({ side, pos, type });
    setTimeout(() => setFlash(null), duration);
  };

  useEffect(() => {
    if (puckPossession && (
      puckPossession.team !== prevPossessionRef.current?.team || 
      puckPossession.position !== prevPossessionRef.current?.position
    )) {
      triggerFlash(puckPossession.team, puckPossession.position, 'possession', 1500);
      setPossessionFlashTeam(puckPossession.team);
      setTimeout(() => setPossessionFlashTeam(null), 800);
    }
    prevPossessionRef.current = puckPossession || null;
  }, [puckPossession]);

  const handleRinkClick = (side: 'home' | 'away', pos: Position) => {
    const teamName = side === 'home' ? homeTeam.name : awayTeam.name;
    const roster = PLAYER_DATA[teamName]?.[pos] || [{ name: `${pos} Prospect`, jerseyNumber: Math.floor(Math.random() * 99) + 1 }];
    if (roster.length === 0) return;

    const currentNum = side === 'home' ? homeNum : awayNum;
    const currentPos = side === 'home' ? homePick : awayPick;
    
    let nextPlayer;
    if (currentPos !== pos) {
      nextPlayer = roster[0];
    } else {
      const currentIndex = roster.findIndex(p => p.jerseyNumber === currentNum);
      nextPlayer = roster[(currentIndex + 1) % roster.length];
    }

    if (side === 'home') {
      setHomePick(pos);
      setHomeNum(nextPlayer.jerseyNumber);
    } else {
      setAwayPick(pos);
      setAwayNum(nextPlayer.jerseyNumber);
    }
    
    triggerFlash(side, pos, 'green', 600);
  };

  const getPosStats = (side: 'home' | 'away', pos: Position) => {
    const posEvents = events.filter(e => e.team === side && e.position === pos);
    const goals = posEvents.filter(e => e.type === 'GOAL' || e.type === 'SO_GOAL').length;
    const assists = posEvents.filter(e => e.type === 'ASSIST').length;
    return { goals, assists };
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

  const getTooltipPositionClasses = (left: string, top: string) => {
    const l = parseFloat(left);
    const t = parseFloat(top);
    
    let xClass = 'left-1/2 -translate-x-1/2';
    // Use wider thresholds for horizontal edge cases
    if (l < 35) {
      xClass = 'left-0 translate-x-2';
    } else if (l > 65) {
      xClass = 'right-0 -translate-x-2';
    }
    
    // Vertical positioning: 
    // If dot is in the top 45% of the rink, show below to avoid top boundary.
    // Otherwise show above.
    const yClass = t < 45 ? 'top-full mt-4' : 'bottom-full mb-4';
    
    return `${xClass} ${yClass}`;
  };

  const getPointIndicatorPosition = (left: string) => {
    const l = parseFloat(left);
    if (l > 75) return 'right-[120%]';
    return 'left-[120%]';
  };

  const getPlayerName = (teamName: string, pos: Position | null, num: number | null) => {
    if (!pos || num === null) return 'Select Player';
    const player = PLAYER_DATA[teamName]?.[pos]?.find(p => p.jerseyNumber === num);
    return player ? player.name : `${pos} Active`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto" ref={overlayRef}>
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-visible animate-in fade-in zoom-in duration-500 my-auto relative">
        
        <div className="bg-slate-800/80 p-6 border-b border-slate-700 flex flex-col items-center text-center relative overflow-hidden rounded-t-3xl">
          <div className="flex items-center gap-6 mb-2 relative z-10 w-full justify-between max-w-2xl">
            <div className="flex flex-col items-center gap-1 group">
               <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-slate-700 group-hover:border-blue-500/50 transition-all">
                 {awayTeam.logoUrl ? (
                   <img src={awayTeam.logoUrl} alt={awayTeam.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                 ) : (
                   <span className="text-5xl transition-all duration-300">{awayTeam.logo}</span>
                 )}
               </div>
               <span className="text-[10px] font-black oswald text-slate-400 uppercase">{awayTeam.abbreviation}</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-[0.2em] animate-pulse">
                  {waitingReason || "Lineup Reset"}
                </div>
                {(awayPick || homePick) && (
                  <button
                    onClick={() => {
                      setHomePick(null);
                      setAwayPick(null);
                      setHomeNum(null);
                      setAwayNum(null);
                    }}
                    className="bg-slate-900/50 hover:bg-slate-700 text-slate-500 hover:text-white text-[9px] font-black px-3 py-1 rounded-full border border-slate-700 uppercase tracking-[0.1em] transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-rotate-left text-[8px]"></i>
                    Reset
                  </button>
                )}
              </div>
              <h2 className={`text-3xl font-black oswald uppercase tracking-tighter italic ${isPowerPlay ? 'text-red-500' : strength !== '5v5' ? 'text-amber-500' : 'text-white'}`}>
                {isPowerPlay ? 'POWERPLAY ACTIVE' : strength !== '5v5' ? `SPECIAL TEAMS: ${strength}` : 'LINEUP BUILDER'}
              </h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">Tap dots to deploy & cycle players</p>
            </div>

            <div className="flex flex-col items-center gap-1 group">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-slate-700 group-hover:border-blue-500/50 transition-all">
                {homeTeam.logoUrl ? (
                  <img src={homeTeam.logoUrl} alt={homeTeam.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-5xl transition-all duration-300">{homeTeam.logo}</span>
                )}
              </div>
              <span className="text-[10px] font-black oswald text-slate-400 uppercase">{homeTeam.abbreviation}</span>
            </div>
          </div>
        </div>

        <div className="relative bg-slate-100 border-b border-slate-400 p-1 rounded-b-3xl">
          <div className="relative w-full aspect-[2.4/1] bg-white shadow-inner rounded-[40px] overflow-hidden border-4 border-slate-300">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
            
            {/* Possession Change Flash Overlay */}
            {possessionFlashTeam && (
              <div 
                className="absolute inset-0 z-30 pointer-events-none animate-possession-flash"
                style={{ 
                  background: `radial-gradient(circle at ${possessionFlashTeam === 'home' ? '75%' : '25%'} 50%, ${possessionFlashTeam === 'home' ? homeTeam.color : awayTeam.color}33 0%, transparent 70%)` 
                }}
              />
            )}
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 240 100" preserveAspectRatio="none">
              {/* Rink Outline for Rounded Corners reinforcement */}
              <rect x="0.5" y="0.5" width="239" height="99" rx="15" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />

              {/* Subtle Zone Shading */}
              <rect x="0" y="0" width="84" height="100" fill="rgba(239, 68, 68, 0.02)" />
              <rect x="156" y="0" width="84" height="100" fill="rgba(239, 68, 68, 0.02)" />
              <rect x="84" y="0" width="72" height="100" fill="rgba(59, 130, 246, 0.02)" />

              {/* Trapezoids behind net */}
              <g stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.8" fill="none">
                <line x1="0" y1="33.5" x2="14.4" y2="39.4" />
                <line x1="0" y1="66.5" x2="14.4" y2="60.6" />
                <line x1="240" y1="33.5" x2="225.6" y2="39.4" />
                <line x1="240" y1="66.5" x2="225.6" y2="60.6" />
              </g>

              {/* Goal Lines */}
              <line x1="14.4" y1="0" x2="14.4" y2="100" stroke="rgba(239, 68, 68, 1)" strokeWidth="1.2" />
              <line x1="225.6" y1="0" x2="225.6" y2="100" stroke="rgba(239, 68, 68, 1)" strokeWidth="1.2" />

              {/* Goal Creases - More detailed D-shape */}
              <g fill="rgba(59, 130, 246, 0.15)" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="0.8">
                <path d="M 14.4 44 L 18 44 A 6 6 0 0 1 18 56 L 14.4 56 Z" />
                <path d="M 225.6 44 L 222 44 A 6 6 0 0 0 222 56 L 225.6 56 Z" />
              </g>
              
              {/* Blue Lines */}
              <rect x="84" y="0" width="2.5" height="100" fill="rgba(59, 130, 246, 1)" />
              <rect x="154.5" y="0" width="2.5" height="100" fill="rgba(59, 130, 246, 1)" />
              
              {/* Center Line */}
              <rect x="119.25" y="0" width="2" height="100" fill="rgba(239, 68, 68, 1)" />
              
              {/* Center Circle & Distinct Dot */}
              <circle cx="120" cy="50" r="15" fill="none" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="1" />
              <circle cx="120" cy="50" r="2.5" fill="rgba(59, 130, 246, 1)" stroke="white" strokeWidth="0.5" />

              {/* End Zone Face-off Circles with Hash Marks */}
              {[
                { cx: 45, cy: 25 }, { cx: 45, cy: 75 },
                { cx: 195, cy: 25 }, { cx: 195, cy: 75 }
              ].map((circle, i) => (
                <g key={`faceoff-circle-${i}`}>
                  <circle cx={circle.cx} cy={circle.cy} r="15" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.8" />
                  <circle cx={circle.cx} cy={circle.cy} r="1.5" fill="rgba(239, 68, 68, 1)" />
                  {/* Hash marks */}
                  <line x1={circle.cx - 2} y1={circle.cy - 15} x2={circle.cx - 2} y2={circle.cy - 17} stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.5" />
                  <line x1={circle.cx + 2} y1={circle.cy - 15} x2={circle.cx + 2} y2={circle.cy - 17} stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.5" />
                  <line x1={circle.cx - 2} y1={circle.cy + 15} x2={circle.cx - 2} y2={circle.cy + 17} stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.5" />
                  <line x1={circle.cx + 2} y1={circle.cy + 15} x2={circle.cx + 2} y2={circle.cy + 17} stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.5" />
                </g>
              ))}

              {/* Neutral Zone Face-off Dots */}
              <circle cx="100" cy="25" r="1.2" fill="rgba(239, 68, 68, 0.6)" />
              <circle cx="100" cy="75" r="1.2" fill="rgba(239, 68, 68, 0.6)" />
              <circle cx="140" cy="25" r="1.2" fill="rgba(239, 68, 68, 0.6)" />
              <circle cx="140" cy="75" r="1.2" fill="rgba(239, 68, 68, 0.6)" />

              {/* Referee Crease (Semi-circle at center line) */}
              <path d="M 120 0 A 8 8 0 0 1 120 8" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Interactive Layer: Moved outside overflow-hidden to prevent tooltip clipping */}
          <div className="absolute inset-1 pointer-events-none z-40">
            <div className="relative w-full h-full">
              {['away', 'home'].map((side) => 
                POSITIONS.map((pos) => {
                  const isHomeSide = side === 'home';
                  const coords = getPosCoords(pos.value, isHomeSide);
                  const isSelected = isHomeSide ? homePick === pos.value : awayPick === pos.value;
                  const selectedNum = isHomeSide ? homeNum : awayNum;
                  const teamName = isHomeSide ? homeTeam.name : awayTeam.name;
                  const roster = PLAYER_DATA[teamName]?.[pos.value] || [];
                  const currentSelectedPlayer = isSelected ? (roster.find(p => p.jerseyNumber === selectedNum) || { name: `${pos.value} Active`, jerseyNumber: selectedNum }) : null;
                  const previewPlayer = roster[0] || { name: `${pos.value} Prospect`, jerseyNumber: '??' };
                  
                  const isThisHovered = hovered?.side === side && hovered?.pos === pos.value;
                  const teamColor = isHomeSide ? homeTeam.color : awayTeam.color;
                  const hasPuck = puckPossession?.team === side && puckPossession?.position === pos.value;

                  const isManualFlashing = flash?.side === side && flash?.pos === pos.value;
                  let flashClass = '';
                  let flashStyle: React.CSSProperties = {};
                  if (isManualFlashing) {
                    if (flash.type === 'possession') {
                      flashClass = 'animate-possession-pulse';
                      flashStyle = { '--pulse-color': teamColor } as React.CSSProperties;
                    } else {
                      flashClass = flash.type === 'green' ? 'animate-flash-green' : 'animate-flash-red';
                    }
                  } else if (isSelected) {
                    flashClass = 'animate-selection-pulse';
                    flashStyle = { '--pulse-color': teamColor } as React.CSSProperties;
                  }

                  const tooltipPositionClass = getTooltipPositionClasses(coords.left, coords.top);
                  const pointTagPos = getPointIndicatorPosition(coords.left);
                  const relevantPoints = floatingPoints?.filter(fp => fp.team === side && fp.position === pos.value) || [];
                  const stats = getPosStats(side as 'home' | 'away', pos.value);

                  return (
                    <div key={`tactical-container-${side}-${pos.value}`} style={{ top: coords.top, left: coords.left }} className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center overflow-visible">
                      <button
                        onMouseEnter={() => setHovered({ side: side as 'home' | 'away', pos: pos.value })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => handleRinkClick(side as 'home' | 'away', pos.value)}
                        className={`relative flex flex-col items-center justify-center transition-all z-10 shadow-lg pointer-events-auto ${
                          hasPuck
                            ? 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-4 border-2 border-white text-white animate-puck-carrier'
                            : isSelected
                              ? 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-white text-white'
                              : isThisHovered
                                ? 'w-10 h-10 sm:w-12 sm:h-12 rounded-full scale-110 border-2 border-slate-400'
                                : 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 text-white border-2 border-slate-600'
                        } ${flashClass}`}
                        style={{
                          ...(hasPuck ? { backgroundColor: teamColor, boxShadow: `0 0 20px 5px ${teamColor}80` } : isSelected ? { backgroundColor: teamColor, boxShadow: `0 0 0 4px ${teamColor}4D` } : {}),
                          ...flashStyle
                        }}
                      >
                        {isSelected ? (
                          <div className="flex flex-col items-center justify-center gap-0.5 w-full px-1">
                            <span className="text-[8px] sm:text-[10px] font-black oswald uppercase leading-none truncate w-full text-center">
                              {currentSelectedPlayer?.name.split(' ').pop()}
                            </span>
                            <div className="h-[1px] w-full bg-white/30 my-0.5"></div>
                            <span className="text-xs sm:text-sm font-black oswald leading-none">
                              #{selectedNum}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] sm:text-sm font-black oswald leading-none">
                            {pos.value}
                          </span>
                        )}
                        {hasPuck && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-black rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-black shadow-lg animate-bounce">
                            P
                          </div>
                        )}
                      </button>
                      
                      {relevantPoints.map(fp => (
                        <div 
                          key={`pt-tag-${fp.id}`}
                          className={`absolute pointer-events-none z-[60] font-black oswald text-[10px] sm:text-xs px-2 py-0.5 rounded-full border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-point-badge-pop flex items-center gap-1.5 ${fp.points > 0 ? 'bg-green-500 border-green-200 text-white' : 'bg-red-500 border-red-200 text-white'} ${pointTagPos}`}
                          style={{ 
                            top: '10%',
                            boxShadow: `0 0 25px ${fp.points > 0 ? '#22c55e' : '#ef4444'}CC` 
                          }}
                        >
                          <i className={`fa-solid ${fp.points > 0 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                          {fp.points > 0 ? '+' : ''}{fp.points}
                        </div>
                      ))}

                      {isThisHovered && (
                        <div 
                          className={`absolute z-[400] w-64 max-w-[calc(100vw-4rem)] bg-slate-950 backdrop-blur-3xl border border-slate-700 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-in zoom-in duration-200 pointer-events-none overflow-hidden ${tooltipPositionClass}`} 
                          style={{ 
                            boxShadow: `0 15px 50px -10px ${teamColor}60` 
                          }}
                        >
                          {/* Header Section */}
                          <div className="p-4 relative overflow-hidden border-b border-white/10">
                            <div className="absolute top-0 right-0 p-2 opacity-[0.05] scale-[2.5] rotate-12">
                              <span className="text-6xl">{isHomeSide ? homeTeam.logo : awayTeam.logo}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 relative z-10">
                              <div className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-white/30 flex flex-col items-center justify-center shadow-xl" style={{ backgroundColor: teamColor }}>
                                <span className="text-[10px] font-black oswald text-white/70 leading-none mb-1 uppercase tracking-tighter">No.</span>
                                <span className="text-2xl font-black oswald text-white leading-none">
                                  {isSelected ? currentSelectedPlayer?.jerseyNumber : previewPlayer.jerseyNumber}
                                </span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{pos.label}</span>
                                  <span className={`flex-shrink-0 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isSelected ? 'bg-green-500 text-white border border-green-400' : 'bg-slate-800 text-slate-300 border border-slate-600'}`}>
                                    {isSelected ? 'ACTIVE' : 'READY'}
                                  </span>
                                </div>
                                <h4 className="text-xl font-black text-white oswald uppercase italic leading-none truncate tracking-tight">
                                  {isSelected ? currentSelectedPlayer?.name : previewPlayer.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ backgroundColor: teamColor }}></div>
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                    {isHomeSide ? homeTeam.abbreviation : awayTeam.abbreviation} • {isHomeSide ? homeTeam.city : awayTeam.city}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stats Section */}
                          <div className="p-4 grid grid-cols-2 gap-2 relative z-10 bg-slate-900/50">
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Goals</span>
                              <span className="text-3xl font-black text-white oswald leading-none tabular-nums drop-shadow-md">{stats.goals}</span>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assists</span>
                              <span className="text-3xl font-black text-white oswald leading-none tabular-nums drop-shadow-md">{stats.assists}</span>
                            </div>
                          </div>

                          {/* Footer Action */}
                          <div className="px-4 py-3 bg-slate-900 border-t border-white/10 flex items-center justify-center gap-2">
                             <i className="fa-solid fa-hand-pointer text-slate-400 text-[10px] animate-bounce"></i>
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                               {isSelected ? 'Cycle Player Slot' : 'Draft into Lineup'}
                             </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Removed bottom message for maximum speed */}
      </div>
      <style>{`
        @keyframes possession-pulse {
          0% { box-shadow: 0 0 0 0 #22c55e; border-color: #22c55e; border-width: 2px; transform: scale(1); }
          50% { box-shadow: 0 0 30px 15px rgba(34, 197, 94, 0.6); border-color: #4ade80; border-width: 8px; transform: scale(1.4); }
          100% { box-shadow: 0 0 0 0 transparent; border-color: transparent; border-width: 2px; transform: scale(1); }
        }
        @keyframes selection-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          50% { box-shadow: 0 0 10px 4px var(--pulse-color); opacity: 0.9; }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
        }
        @keyframes point-badge-pop {
          0% { transform: scale(0.3) translateY(15px); opacity: 0; filter: blur(4px); }
          15% { transform: scale(1.4) translateY(-8px); opacity: 1; filter: blur(0); }
          30% { transform: scale(1) translateY(0); }
          75% { transform: scale(1) translateY(-15px); opacity: 1; }
          100% { transform: scale(0.7) translateY(-35px); opacity: 0; filter: blur(8px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shutter-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }
        @keyframes shutter-up {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes success-pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes signal-bar {
          0%, 100% { height: 20%; opacity: 0.3; }
          50% { height: 100%; opacity: 1; }
        }
        @keyframes puck-carrier-glow {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(34, 197, 94, 0.6); border-color: rgba(34, 197, 94, 0.4); border-width: 2px; }
          50% { box-shadow: 0 0 24px 8px rgba(34, 197, 94, 0.9); border-color: rgba(34, 197, 94, 1); border-width: 4px; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes possession-flash {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animate-shutter-down { animation: shutter-down 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-shutter-up { animation: shutter-up 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-success-pop { animation: success-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-signal-bar { animation: signal-bar 1s infinite ease-in-out; }
        .animate-puck-carrier { animation: puck-carrier-glow 1.5s infinite ease-in-out; }
        .animate-ping-slow { animation: ping-slow 2s infinite cubic-bezier(0, 0, 0.2, 1); }
        .animate-possession-flash { animation: possession-flash 0.8s ease-out forwards; }
        .animate-possession-pulse { animation: possession-pulse 1.5s ease-in-out; }
        .animate-selection-pulse { animation: selection-pulse 2.5s infinite ease-in-out; }
        .animate-point-badge-pop { animation: point-badge-pop 2.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
      `}</style>
    </div>
  );
};

export default SelectionOverlay;