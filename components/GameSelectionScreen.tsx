import React from 'react';
import { ScheduledGame } from '../types';

interface GameSelectionScreenProps {
  games: ScheduledGame[];
  onSelectGame: (game: ScheduledGame) => void;
  isLoading: boolean;
}

const GameSelectionScreen: React.FC<GameSelectionScreenProps> = ({ games, onSelectGame, isLoading }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-12">
          <div className="inline-block bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full mb-4 border border-blue-500/30">
            Live Schedule Grounding
          </div>
          <h1 className="text-5xl font-black oswald uppercase tracking-tighter text-white mb-2 italic">Select Today's Matchup</h1>
          <p className="text-slate-400 font-medium">Choose a game to join the live tactical simulation</p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black oswald uppercase tracking-widest animate-pulse">Scanning the Ice for Games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <i className="fa-solid fa-calendar-xmark text-5xl text-slate-700 mb-6"></i>
            <h3 className="text-xl font-bold text-white mb-2">No Games Found</h3>
            <p className="text-slate-500">There are no NHL games scheduled for today or they haven't started yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left transition-all hover:bg-slate-800/80 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-2">
                    <div className="bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-700 group-hover:border-blue-500/30 transition-colors">
                      {game.startTime}
                    </div>
                    {game.status && (
                      <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border self-start ${game.status.toLowerCase() === 'live' ? 'text-red-500 border-red-500/30 animate-pulse' : 'text-slate-500 border-slate-700'}`}>
                        {game.status}
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <i className="fa-solid fa-location-dot"></i>
                    {game.venue}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-700 group-hover:border-blue-500/50 transition-all">
                      {game.awayTeam.logoUrl ? (
                        <img src={game.awayTeam.logoUrl} alt={game.awayTeam.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-4xl filter group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
                          {game.awayTeam.logo}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{game.awayTeam.city}</div>
                      <div className="text-lg font-black oswald uppercase text-white leading-none">{game.awayTeam.name}</div>
                    </div>
                  </div>

                  <div className="text-xl font-black oswald text-slate-700 italic px-4">VS</div>

                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-700 group-hover:border-blue-500/50 transition-all">
                      {game.homeTeam.logoUrl ? (
                        <img src={game.homeTeam.logoUrl} alt={game.homeTeam.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-4xl filter group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
                          {game.homeTeam.logo}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{game.homeTeam.city}</div>
                      <div className="text-lg font-black oswald uppercase text-white leading-none">{game.homeTeam.name}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 w-full py-3 bg-slate-950 rounded-xl border border-slate-800 group-hover:bg-blue-600 group-hover:border-blue-400 transition-all flex items-center justify-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Join Powerplay</span>
                  <i className="fa-solid fa-arrow-right text-[10px] text-slate-600 group-hover:text-white transition-transform group-hover:translate-x-1"></i>
                </div>
              </button>
            ))}
          </div>
        )}

        <footer className="mt-16 text-center">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            Schedule powered by Gemini Search & NHL Live API Grounding
          </p>
        </footer>
      </div>
    </div>
  );
};

export default GameSelectionScreen;