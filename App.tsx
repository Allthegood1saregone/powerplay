
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameState, Position, GameEvent, FloatingPoint, GoalExplosion, LeaderboardPlayer, ScheduledGame, OnIceStrength } from './types';
import { INITIAL_TEAMS } from './constants';
import ScoreBoard from './components/ScoreBoard';
import GameLog from './components/GameLog';
import PickStatus from './components/PickStatus';
import PerformanceSummary from './components/PerformanceSummary';
import ScoringRules from './components/ScoringRules';
import Leaderboard from './components/Leaderboard';
import SelectionOverlay from './components/SelectionOverlay';
import GameSelectionScreen from './components/GameSelectionScreen';
import { fetchLiveGameData, fetchTodayGames } from './services/geminiService';
import { requestNotificationPermission, sendGameNotification, getNotificationStatus } from './services/notificationService';

const PlayByPlayFeed: React.FC<{ events: GameEvent[], onSimulate?: () => void, isLoading?: boolean }> = ({ events, onSimulate, isLoading }) => {
  const lastFive = events.slice(0, 5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <i className="fa-solid fa-bolt-lightning text-amber-500"></i>
          Recent Play-By-Play
        </h3>
        <div className="flex items-center gap-3">
          {onSimulate && (
            <button 
              onClick={onSimulate}
              disabled={isLoading}
              className="text-[8px] font-black bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
            >
              <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
              {isLoading ? 'SIMULATING...' : 'SIM PLAY'}
            </button>
          )}
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Top 5 Action items</span>
        </div>
      </div>
      <div className="divide-y divide-slate-800/50">
        {lastFive.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            <p className="text-[10px] font-black uppercase tracking-widest">Waiting for the puck to drop...</p>
          </div>
        ) : (
          lastFive.map((event) => (
            <div key={`pbp-${event.id}`} className="p-3 flex items-center gap-4 hover:bg-slate-800/20 transition-colors group">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black border-2 shadow-sm transition-transform group-hover:scale-110 ${event.team === 'home' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-amber-500 border-amber-300 text-slate-950'}`}>
                {event.position}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-black oswald text-slate-500">{event.gameTime}</span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${event.type === 'GOAL' ? 'bg-red-500/20 text-red-500' : event.type.includes('PENALTY') || event.type === 'MISCONDUCT' ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-400'}`}>
                    {event.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate group-hover:text-white transition-colors">
                  {event.description}
                </p>
              </div>
              {event.userEarned !== 0 && (
                <div className={`text-right font-black oswald text-lg ${event.userEarned! > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {event.userEarned! > 0 ? '+' : ''}{event.userEarned}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [scheduledGames, setScheduledGames] = useState<ScheduledGame[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [hasSelectedGame, setHasSelectedGame] = useState(false);
  const [isRealTimeSync, setIsRealTimeSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [game, setGame] = useState<GameState>({
    period: 1,
    timeRemaining: '20:00',
    isPaused: false,
    waitingForPicks: true,
    homeTeam: INITIAL_TEAMS.home,
    awayTeam: INITIAL_TEAMS.away,
    userPicks: { home: null, away: null, homeNumber: null, awayNumber: null },
    totalPoints: 0,
    rank: 124,
    totalPlayers: 1542,
    events: [
      {
        id: 'init-1',
        timestamp: Date.now() - 300000,
        gameTime: '15:20',
        team: 'home',
        position: 'RW',
        type: 'SHOT',
        description: 'A. Lafreniere (NYR) snaps a quick shot from the slot, saved by Swayman.',
        points: 200,
        period: 1
      },
      {
        id: 'init-2',
        timestamp: Date.now() - 240000,
        gameTime: '16:45',
        team: 'away',
        position: 'LD',
        type: 'HIT',
        description: 'H. Lindholm (BOS) delivers a heavy check along the boards.',
        points: 500,
        period: 1
      },
      {
        id: 'init-3',
        timestamp: Date.now() - 180000,
        gameTime: '17:12',
        team: 'home',
        position: 'G',
        type: 'SAVE',
        description: 'I. Shesterkin (NYR) makes a spectacular glove save on Pastrnak!',
        points: 250,
        period: 1
      },
      {
        id: 'init-4',
        timestamp: Date.now() - 120000,
        gameTime: '18:30',
        team: 'away',
        position: 'C',
        type: 'PASS',
        description: 'C. Coyle (BOS) completes a crisp cross-ice pass.',
        points: 100,
        period: 1
      },
      {
        id: 'init-5',
        timestamp: Date.now() - 60000,
        gameTime: '19:15',
        team: 'home',
        position: 'LD',
        type: 'BLOCKED_SHOT',
        description: 'R. Lindgren (NYR) dives to block a dangerous point shot.',
        points: 200,
        period: 1
      }
    ],
    puckPossession: null,
    strength: '5v5',
    status: 'Simulation',
    isPowerPlay: false,
    penaltyClocks: []
  });

  const [competitors, setCompetitors] = useState<LeaderboardPlayer[]>(() => {
    return Array.from({ length: 49 }, (_, i) => ({
      id: `comp-${i}`,
      name: `User_${Math.floor(Math.random() * 9000) + 1000}`,
      points: Math.max(0, 15000 - (i * 300) + (Math.random() * 500)),
    }));
  });

  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);
  const [explosions, setExplosions] = useState<GoalExplosion[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isScoringRulesOpen, setIsScoringRulesOpen] = useState(false);
  const [groundingUrls, setGroundingUrls] = useState<{ uri: string; title: string }[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(getNotificationStatus());
  const tickerRef = useRef<any>(null);

  useEffect(() => {
    const loadGames = async () => {
      setIsLoadingSchedule(true);
      const games = await fetchTodayGames();
      setScheduledGames(games);
      setIsLoadingSchedule(false);
    };
    loadGames();
  }, []);

  const handleSelectGame = (selected: ScheduledGame) => {
    setGame(prev => ({
      ...prev,
      homeTeam: { ...selected.homeTeam, score: selected.homeTeam.score || 0 },
      awayTeam: { ...selected.awayTeam, score: selected.awayTeam.score || 0 },
      events: [],
      totalPoints: 0,
      waitingForPicks: true,
      period: 1,
      timeRemaining: '20:00',
      status: selected.status || 'Scheduled'
    }));
    setHasSelectedGame(true);
  };

  const leaderboardData = useMemo(() => {
    const userPlayer: LeaderboardPlayer = {
      id: 'user-main',
      name: 'PuckMaster99',
      points: game.totalPoints,
      isUser: true
    };
    return [...competitors, userPlayer];
  }, [competitors, game.totalPoints]);

  useEffect(() => {
    const sorted = [...leaderboardData].sort((a, b) => b.points - a.points);
    const userIndex = sorted.findIndex(p => p.isUser);
    setGame(prev => ({ ...prev, rank: userIndex + 1 }));
  }, [leaderboardData]);

  const updateCompetitors = useCallback(() => {
    setCompetitors(prev => prev.map(comp => {
      const gain = Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : 0;
      return { ...comp, points: comp.points + gain };
    }));
  }, []);

  const triggerGoalExplosion = (team: 'home' | 'away') => {
    const id = Math.random().toString(36).substr(2, 9);
    const color = team === 'home' ? game.homeTeam.color : game.awayTeam.color;
    setExplosions(prev => [...prev, { id, team, color }]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== id));
    }, 3000);
  };

  const triggerPointsAnimation = (points: number, team: 'home' | 'away', position: Position, isUser: boolean) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newFloatingPoint: FloatingPoint = {
      id,
      points,
      team,
      position,
      isUser,
      xOffset: (Math.random() - 0.5) * 40,
      variant: Math.floor(Math.random() * 3),
    };
    setFloatingPoints(prev => [...prev, newFloatingPoint]);
    setTimeout(() => {
      setFloatingPoints(prev => prev.filter(fp => fp.id !== id));
    }, 2000);
  };

  const simManualPlay = useCallback(async () => {
    if (loadingEvents) return;
    setLoadingEvents(true);
    try {
      const result = await fetchLiveGameData(
        game.period,
        game.timeRemaining,
        game.homeTeam,
        game.awayTeam
      );
      
      const processedEvents = result.events.map(event => ({
        ...event,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        userEarned: 0 
      })) as GameEvent[];

      setGame(prev => ({
        ...prev,
        events: [...processedEvents, ...prev.events]
      }));
    } finally {
      setLoadingEvents(false);
    }
  }, [game.period, game.timeRemaining, game.homeTeam, game.awayTeam, loadingEvents]);

  const processEvents = useCallback(async () => {
    if (loadingEvents || !hasSelectedGame) return;

    setLoadingEvents(true);
    const result = await fetchLiveGameData(
      game.period,
      game.timeRemaining,
      game.homeTeam,
      game.awayTeam
    );

    setIsRealTimeSync(result.realTimeSync);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    // If we are waiting for picks, only update the scoreboard state
    if (game.waitingForPicks) {
      if (result.realTimeSync && result.liveState) {
        setGame(prev => ({
          ...prev,
          homeTeam: { ...prev.homeTeam, score: result.liveState!.homeScore },
          awayTeam: { ...prev.awayTeam, score: result.liveState!.awayScore },
          period: result.liveState!.period,
          timeRemaining: result.liveState!.timeRemaining,
          status: result.liveState!.status,
        }));
      }
      setLoadingEvents(false);
      return;
    }

    let newPoints = 0;
    let currentHomeScore = game.homeTeam.score;
    let currentAwayScore = game.awayTeam.score;

    if (result.realTimeSync && result.liveState) {
      currentHomeScore = result.liveState.homeScore;
      currentAwayScore = result.liveState.awayScore;
    }

    let goalScored = false;
    let scoringTeamType: 'home' | 'away' | null = null;

    const processedEvents = result.events.map(event => {
      if (event.type === 'GOAL') {
        goalScored = true;
        scoringTeamType = event.team as 'home' | 'away';
        // Only increment score manually if NOT in real-time sync mode
        // In real-time sync, the score is updated from result.liveState above
        if (!result.realTimeSync) {
          if (event.team === 'home') currentHomeScore++;
          else currentAwayScore++;
        }
      }

      const userPickForTeam = event.team === 'home' ? game.userPicks.home : game.userPicks.away;
      const isUserPick = event.position === userPickForTeam;
      const earned = isUserPick ? (event.points || 0) : 0;
      
      if (isUserPick && (event.type.includes('PENALTY') || event.type === 'MISCONDUCT')) {
        sendGameNotification("Penalty!", `Your pick ${event.position} took a penalty: ${event.description}`);
      }

      if (earned !== 0) {
        newPoints += earned;
        triggerPointsAnimation(earned, event.team!, event.position!, true);
      } else if (event.points && event.points !== 0) {
        triggerPointsAnimation(event.points!, event.team!, event.position!, false);
      }

      return { 
        ...event, 
        userEarned: earned, 
        homeScoreAtEvent: currentHomeScore, 
        awayScoreAtEvent: currentAwayScore,
        period: game.period 
      } as GameEvent;
    });

    if (goalScored && scoringTeamType) {
      triggerGoalExplosion(scoringTeamType);
    }

    if (result.nextFaceoffTrigger) {
      sendGameNotification("Face-Off!", "Play stopped. Update your picks now!");
    }

    setGame(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + newPoints,
      events: [...processedEvents, ...prev.events].slice(0, 100),
      homeTeam: { ...prev.homeTeam, score: currentHomeScore },
      awayTeam: { ...prev.awayTeam, score: currentAwayScore },
      waitingForPicks: result.nextFaceoffTrigger,
      puckPossession: result.currentPossession,
      isPowerPlay: result.isPowerPlay,
      penaltyClocks: result.penaltyClocks || [],
      strength: result.strength || (result.isPowerPlay ? 'PP' : '5v5'),
      period: (result.realTimeSync && result.liveState) ? result.liveState.period : prev.period,
      timeRemaining: (result.realTimeSync && result.liveState) ? result.liveState.timeRemaining : prev.timeRemaining,
      status: (result.realTimeSync && result.liveState) ? result.liveState.status : prev.status,
    }));

    updateCompetitors();
    setLoadingEvents(false);
  }, [game.period, game.timeRemaining, game.homeTeam, game.awayTeam, game.userPicks, game.waitingForPicks, loadingEvents, game.homeTeam.score, game.awayTeam.score, updateCompetitors, hasSelectedGame]);

  useEffect(() => {
    if (game.waitingForPicks || game.isPaused || !hasSelectedGame || isRealTimeSync) return;
    tickerRef.current = setInterval(() => {
      setGame(prev => {
        const [mins, secs] = prev.timeRemaining.split(':').map(Number);
        let totalSecs = mins * 60 + secs - 12;
        if (totalSecs <= 0) {
          if (prev.period < 3) return { ...prev, period: prev.period + 1, timeRemaining: '20:00', waitingForPicks: true, puckPossession: null };
          return { ...prev, isPaused: true, timeRemaining: '00:00', puckPossession: null };
        }
        const newMins = Math.floor(totalSecs / 60);
        const newSecs = totalSecs % 60;
        return { ...prev, timeRemaining: `${newMins.toString().padStart(2, '0')}:${newSecs.toString().padStart(2, '0')}` };
      });
    }, 1000);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [game.waitingForPicks, game.isPaused, hasSelectedGame, isRealTimeSync]);

  useEffect(() => {
    if (hasSelectedGame) {
      processEvents();
    }
  }, [hasSelectedGame, processEvents]);

  useEffect(() => {
    if (game.isPaused || !hasSelectedGame) return;
    const eventInterval = setInterval(() => { processEvents(); }, 8000);
    return () => clearInterval(eventInterval);
  }, [game.isPaused, processEvents, hasSelectedGame]);

  const handlePicks = async (picks: { home: Position; away: Position; homeNumber: number; awayNumber: number }) => {
    if (notifPermission === 'default') {
      const granted = await requestNotificationPermission();
      setNotifPermission(granted ? 'granted' : 'denied');
    }
    setGame(prev => ({ ...prev, userPicks: picks, waitingForPicks: false }));
  };

  const openPicks = () => {
    if (game.waitingForPicks || (game.period < 5 && !game.waitingForPicks)) return;
    setGame(prev => ({ ...prev, waitingForPicks: true, puckPossession: null }));
  };

  const goBackToSelection = () => {
    setHasSelectedGame(false);
  };

  if (!hasSelectedGame) {
    return <GameSelectionScreen games={scheduledGames} onSelectGame={handleSelectGame} isLoading={isLoadingSchedule} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 relative overflow-hidden">
      {explosions.map(exp => (
        <div key={exp.id} className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <style>{`
            .dynamic-bg-${exp.id} { background-color: ${exp.color}22; }
            .dynamic-radial-${exp.id} { background: radial-gradient(circle, ${exp.color} 0%, transparent 70%); }
          `}</style>
          <div className={`absolute inset-0 animate-screen-flash dynamic-bg-${exp.id}`} />
          <div className="relative">
            <div className="text-8xl font-black oswald uppercase text-white animate-goal-text drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">GOAL!</div>
            <div className={`absolute inset-0 animate-goal-explosion dynamic-radial-${exp.id}`} />
          </div>
        </div>
      ))}

      {game.waitingForPicks && (
        <SelectionOverlay 
          homeTeam={game.homeTeam} 
          awayTeam={game.awayTeam} 
          onConfirm={handlePicks} 
          events={game.events}
          puckPossession={game.puckPossession}
          floatingPoints={floatingPoints}
          strength={game.strength}
          isPowerPlay={game.isPowerPlay}
        />
      )}

          <ScoreBoard 
            home={game.homeTeam} 
            away={game.awayTeam} 
            period={game.period} 
            time={game.timeRemaining} 
            strength={game.strength} 
            isRealTimeSync={isRealTimeSync} 
            status={game.status}
            isPowerPlay={game.isPowerPlay}
            penaltyClocks={game.penaltyClocks}
          />

      <ScoringRules isOpen={isScoringRulesOpen} onClose={() => setIsScoringRulesOpen(false)} />

      <main className="flex-1 max-w-6xl mx-auto w-full p-4">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsScoringRulesOpen(true)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2 group"
            >
              <i className="fa-solid fa-circle-info group-hover:scale-110 transition-transform"></i>
              Scoring Rules
            </button>
            <button 
              onClick={goBackToSelection}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <i className="fa-solid fa-chevron-left group-hover:-translate-x-1 transition-transform"></i>
              Change Game
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {isRealTimeSync && (
              <div className="bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2 animate-pulse border border-green-400/50">
                 <i className="fa-solid fa-satellite-dish"></i>
                 Live Match Grounding
              </div>
            )}
            
            <div className={`flex items-center gap-3 bg-slate-900/90 border ${isRealTimeSync ? 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-slate-800'} px-4 py-2 rounded-2xl transition-all duration-500`}>
              <div className="relative flex h-3 w-3">
                {loadingEvents ? (
                  <i className="fa-solid fa-spinner fa-spin text-blue-400 text-[12px]"></i>
                ) : (
                  <>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRealTimeSync ? 'bg-green-400' : 'bg-slate-600'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isRealTimeSync ? 'bg-green-500' : 'bg-slate-700'}`}></span>
                  </>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isRealTimeSync ? 'text-green-400' : 'text-slate-500'} leading-none`}>
                    {loadingEvents ? 'Syncing...' : isRealTimeSync ? 'Live Sync' : 'Sim Sync'}
                  </span>
                  {isRealTimeSync && <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>}
                </div>
                {lastSyncTime && (
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase mt-1 flex items-center gap-1">
                    <i className="fa-regular fa-clock text-[7px]"></i>
                    {lastSyncTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8 order-2 lg:order-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score</div>
                <div className="text-3xl font-black text-amber-500 oswald">{game.totalPoints.toLocaleString()}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Rank</div>
                <div className="text-3xl font-black text-blue-400 oswald">#{game.rank}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hidden sm:block">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
                <div className="text-xs font-black text-white uppercase">{game.waitingForPicks ? 'Drafting Lines' : 'POWERPLAY Active'}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg hidden sm:block">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Players</div>
                <div className="text-3xl font-black text-slate-300 oswald">{game.totalPlayers.toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-3">
                    <i className="fa-solid fa-clock-rotate-left text-blue-500"></i>
                    Last Few Plays
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Action</span>
                </div>
                <div className="space-y-4">
                  {game.events.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-700 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                      <i className="fa-solid fa-hockey-puck text-3xl mb-3 opacity-20"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">Waiting for action...</p>
                    </div>
                  ) : (
                    game.events.slice(0, 8).map((event) => (
                      <div key={`main-mini-${event.id}`} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-right duration-500 hover:bg-slate-800/60 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black border-2 shadow-lg ${event.team === 'home' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-amber-500 border-amber-300 text-slate-950'}`}>
                          {event.position}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase">{event.gameTime}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${event.type === 'GOAL' ? 'bg-red-500/20 text-red-500' : event.type.includes('PENALTY') || event.type === 'MISCONDUCT' ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-400'}`}>{event.type.replace('_', ' ')}</span>
                          </div>
                          <p className="text-sm text-slate-200 font-medium">{event.description}</p>
                        </div>
                        {event.userEarned !== 0 && (
                          <div className={`text-right font-black oswald text-lg ${event.userEarned! > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {event.userEarned! > 0 ? '+' : ''}{event.userEarned}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <PlayByPlayFeed events={game.events} onSimulate={simManualPlay} isLoading={loadingEvents} />
            </div>

            <PerformanceSummary events={game.events} />
            <GameLog events={game.events} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
          </div>

          <div className="lg:w-80 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6 flex flex-col min-h-screen">
              <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl transition-all duration-500 ${game.waitingForPicks ? 'ring-2 ring-amber-500/30' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      Tactical Command
                      <span className={`w-1.5 h-1.5 rounded-full ${game.waitingForPicks ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                   </div>
                   <div className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${game.waitingForPicks ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                    {game.waitingForPicks ? 'Update Lineup' : 'Picks Locked'}
                   </div>
                </div>
                
                <PickStatus 
                  homeTeam={game.homeTeam} 
                  awayTeam={game.awayTeam} 
                  userPicks={game.userPicks} 
                  floatingPoints={floatingPoints}
                  isSelecting={game.waitingForPicks || game.period >= 5}
                  onConfirmPicks={handlePicks}
                  puckPossession={game.puckPossession}
                  events={game.events} // Passed events
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                    <i className="fa-solid fa-satellite-dish text-red-500 animate-pulse"></i> Live Feed
                  </h3>
                  {loadingEvents && <div className="text-[8px] font-bold text-slate-500 uppercase animate-pulse"><i className="fa-solid fa-spinner fa-spin mr-1"></i>Syncing</div>}
                </div>
                <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto scroll-smooth">
                  {game.events.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-700 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                      <p className="text-[8px] font-black uppercase tracking-widest">Awaiting Data...</p>
                    </div>
                  ) : (
                    game.events.slice(0, 6).map((event) => {
                      const isUserPositive = (event.userEarned || 0) > 0;
                      const isUserNegative = (event.userEarned || 0) < 0;
                      return (
                        <div key={`sidebar-live-${event.id}`} className={`p-3 rounded-lg border transition-all animate-in slide-in-from-right duration-300 relative overflow-hidden ${isUserPositive ? 'bg-green-900/10 border-green-500/40' : isUserNegative ? 'bg-red-900/10 border-red-500/40' : 'bg-slate-950/50 border-slate-800/50'}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-black border shadow-sm ${event.team === 'home' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-amber-500 border-amber-300 text-slate-950'}`}>
                              {event.position}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[7px] font-black text-slate-500 uppercase">{event.gameTime}</span>
                                <span className={`text-[7px] font-black uppercase px-1 rounded ${event.type === 'GOAL' ? 'bg-red-500/20 text-red-500' : event.type.includes('PENALTY') || event.type === 'MISCONDUCT' ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-600'}`}>{event.type.split('_')[0]}</span>
                              </div>
                            </div>
                            {event.userEarned !== 0 && <div className={`text-[10px] font-black oswald ${isUserPositive ? 'text-green-400' : 'text-red-400'}`}>{isUserPositive ? '+' : ''}{event.userEarned}</div>}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-tight">{event.description}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest mb-4">Scoring Key</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Goal</span><span className="text-green-400">+5000</span></div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Assist</span><span className="text-blue-400">+1000</span></div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Save</span><span className="text-green-400">+250</span></div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Hit/Shot</span><span className="text-slate-300">+200</span></div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Giveaway</span><span className="text-red-400">-200</span></div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Penalty</span><span className="text-red-500">-500 to -2000</span></div>
                </div>
              </div>

              <div className="flex-1">
                <Leaderboard players={leaderboardData} userPoints={game.totalPoints} userRank={game.rank} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 border-t border-slate-800 p-4 sm:p-6 shadow-2xl z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">POWERPLAY Points</div>
              <div className="text-3xl font-black oswald text-amber-500 leading-none">{game.totalPoints.toLocaleString()}</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800"></div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Current Rank</div>
              <div className="text-2xl font-black oswald text-white leading-none">#{game.rank}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!game.waitingForPicks && game.period < 5 && (
              <div className="flex flex-col items-end animate-in fade-in slide-in-from-right duration-500">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-lock text-amber-500 text-[10px] animate-pulse"></i>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Picks Locked</span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 italic">Wait for stoppage to edit</span>
              </div>
            )}
            {game.period >= 5 && !game.waitingForPicks && (
              <div className="flex flex-col items-end animate-in fade-in slide-in-from-right duration-500">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-bolt text-blue-400 text-[10px] animate-pulse"></i>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Shootout Mode</span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 italic">Rapid updates enabled</span>
              </div>
            )}
            <button 
              onClick={openPicks} 
              disabled={game.waitingForPicks || (!game.waitingForPicks && game.period < 5)} 
              className={`px-8 py-3 rounded-xl font-black oswald text-lg uppercase tracking-widest transition-all active:scale-95 ${
                !game.waitingForPicks && (game.period >= 5)
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 ring-2 ring-blue-400/50' 
                : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50'
              }`}
            >
              {game.waitingForPicks ? 'Drafting Open' : game.period >= 5 ? 'Update Lineup' : 'Picks Locked'}
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes screen-flash { 0% { opacity: 0; } 10% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes goal-text { 0% { transform: scale(0.5); opacity: 0; filter: blur(10px); } 20% { transform: scale(1.2); opacity: 1; filter: blur(0); } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; filter: blur(20px); } }
        @keyframes goal-explosion { 0% { transform: scale(0); opacity: 0.8; } 100% { transform: scale(4); opacity: 0; } }
        .animate-screen-flash { animation: screen-flash 1.5s ease-out forwards; }
        .animate-goal-text { animation: goal-text 2s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards; }
        .animate-goal-explosion { animation: goal-explosion 1s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
