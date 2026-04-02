import React from 'react';
import { SCORING_RULES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoringRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScoringRules: React.FC<ScoringRulesProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black oswald uppercase tracking-tighter text-white italic">Scoring Protocol</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Tactical Point Allocation System</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Skater Rules */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  <h3 className="text-sm font-black oswald uppercase tracking-widest text-blue-400">Skater Metrics</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(SCORING_RULES.SKATER).sort((a, b) => b[1] - a[1]).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 group hover:border-blue-500/30 transition-all">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-200 transition-colors">
                        {key.replace('_', ' ')}
                      </span>
                      <span className={`font-mono text-xs font-bold ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {value > 0 ? `+${value}` : value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Goalie Rules */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  <h3 className="text-sm font-black oswald uppercase tracking-widest text-emerald-400">Goalie Metrics</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(SCORING_RULES.GOALIE).sort((a, b) => b[1] - a[1]).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 group hover:border-emerald-500/30 transition-all">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-200 transition-colors">
                        {key.replace('_', ' ')}
                      </span>
                      <span className={`font-mono text-xs font-bold ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {value > 0 ? `+${value}` : value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <i className="fa-solid fa-circle-info text-blue-400 text-xs"></i>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Tactical Note</h4>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                    Points are calculated in real-time based on live game events. Defensive actions like hits and blocks are weighted heavily to reward tactical positioning.
                  </p>
                </div>
              </section>
            </div>

            <div className="bg-slate-950/50 p-6 border-t border-slate-800 flex justify-center">
              <button 
                onClick={onClose}
                className="px-8 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-700"
              >
                Acknowledge Protocol
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScoringRules;
