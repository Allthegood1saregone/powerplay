import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface TournamentEntryProps {
  user: User;
  onSuccess: () => void;
}

const TournamentEntry: React.FC<TournamentEntryProps> = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnterTournament = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          tournamentId: 'daily-tactical-001',
          entryFee: 5,
          tournamentName: 'Daily Tactical Powerplay Tournament',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      const { url } = data;
      
      // Redirect to Stripe
      window.location.href = url;
    } catch (err: any) {
      console.error('Tournament Entry Error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl"
      >
        <div className="relative h-48 bg-blue-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>
          </div>
          <div className="relative text-center">
            <div className="text-6xl mb-2">🏆</div>
            <h2 className="text-2xl font-black oswald uppercase tracking-tighter text-white italic">Elite Tournament</h2>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-slate-400 text-sm font-medium mb-1">Entry Fee</p>
            <div className="text-4xl font-black text-white oswald">$5.00</div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Ranking</div>
                <div className="text-sm font-bold text-white">Global Tactical Leaderboard</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleEnterTournament}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fa-solid fa-credit-card"></i>
                Pay Entry Fee
              </>
            )}
          </button>

          <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest">
            Secure checkout powered by Stripe
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TournamentEntry;
