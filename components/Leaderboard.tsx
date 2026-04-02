
import React from 'react';
import { LeaderboardPlayer } from '../types';

interface LeaderboardProps {
  players: LeaderboardPlayer[];
  userPoints: number;
  userRank: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players, userPoints, userRank }) => {
  // We sort players by points and find the user's relative position
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right duration-700">
      <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
          <i className="fa-solid fa-ranking-star text-amber-500"></i>
          Global Leaderboard
        </h2>
        <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-800/50">
        {sortedPlayers.map((player, index) => {
          const rank = index + 1;
          const isUser = player.isUser;
          
          return (
            <div 
              key={player.id} 
              className={`flex items-center gap-4 px-5 py-3 transition-all ${
                isUser 
                ? 'bg-amber-500/10 border-l-4 border-l-amber-500 relative z-10' 
                : 'hover:bg-slate-800/40'
              }`}
            >
              <div className={`w-8 text-center font-black oswald ${
                rank === 1 ? 'text-amber-500 text-lg' : 
                rank === 2 ? 'text-slate-300' : 
                rank === 3 ? 'text-amber-700' : 
                'text-slate-500 text-xs'
              }`}>
                #{rank}
              </div>
              
              <div className="flex-1 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isUser ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-400'
                }`}>
                  {player.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${isUser ? 'text-white' : 'text-slate-300'}`}>
                    {player.name} {isUser && <span className="text-[9px] text-amber-500 ml-1 font-black uppercase">(You)</span>}
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Pro League</span>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-sm font-black oswald ${isUser ? 'text-amber-500' : 'text-slate-200'}`}>
                  {player.points.toLocaleString()}
                </div>
                <div className="text-[8px] font-bold text-slate-600 uppercase">PTS</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-slate-800/30 p-3 text-center border-t border-slate-800">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Rank updated every puck drop
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
