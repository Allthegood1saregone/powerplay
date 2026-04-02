import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
}

interface TournamentLeaderboardProps {
  tournamentId: string;
  currentUserId?: string;
}

const TournamentLeaderboard: React.FC<TournamentLeaderboardProps> = ({ tournamentId, currentUserId }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const entriesRef = collection(db, 'tournaments', tournamentId, 'entries');
    const q = query(entriesRef, orderBy('score', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEntries = snapshot.docs.map(doc => ({
        userId: doc.data().userId || doc.id,
        displayName: doc.data().displayName || 'Anonymous',
        score: doc.data().score || 0
      }));
      setEntries(newEntries);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `tournaments/${tournamentId}/entries`);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right duration-700">
      <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
          <i className="fa-solid fa-ranking-star text-amber-500"></i>
          Tournament Leaderboard
        </h2>
        <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-800/50">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            <p className="text-[10px] font-black uppercase tracking-widest">No entries yet</p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const rank = index + 1;
            const isUser = entry.userId === currentUserId;
            
            return (
              <div 
                key={entry.userId} 
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
                    {entry.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isUser ? 'text-white' : 'text-slate-300'}`}>
                      {entry.displayName} {isUser && <span className="text-[9px] text-amber-500 ml-1 font-black uppercase">(You)</span>}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Elite Tournament</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-black oswald ${isUser ? 'text-amber-500' : 'text-slate-200'}`}>
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[8px] font-bold text-slate-600 uppercase">PTS</div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="bg-slate-800/30 p-3 text-center border-t border-slate-800">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Rank updated in real-time
        </p>
      </div>
    </div>
  );
};

export default TournamentLeaderboard;
