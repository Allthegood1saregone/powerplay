import React from 'react';

interface PrizeDistributionProps {
  totalPrizePool: number;
}

const PrizeDistribution: React.FC<PrizeDistributionProps> = ({ totalPrizePool }) => {
  const distribution = [
    { rank: 1, percentage: 50, label: '1st Place' },
    { rank: 2, percentage: 25, label: '2nd Place' },
    { rank: 3, percentage: 15, label: '3rd Place' },
    { rank: 4, percentage: 5, label: '4th Place' },
    { rank: 5, percentage: 5, label: '5th Place' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-700">
      <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
          <i className="fa-solid fa-trophy text-amber-500"></i>
          Prize Distribution
        </h2>
        <div className="text-amber-500 font-black oswald text-lg">
          ${totalPrizePool.toLocaleString()}
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {distribution.map((item) => {
          const amount = (totalPrizePool * item.percentage) / 100;
          return (
            <div key={item.rank} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${
                  item.rank === 1 ? 'bg-amber-500 text-slate-950' : 
                  item.rank === 2 ? 'bg-slate-300 text-slate-950' : 
                  item.rank === 3 ? 'bg-amber-700 text-white' : 
                  'bg-slate-800 text-slate-500'
                }`}>
                  {item.rank}
                </div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-black text-slate-200 oswald">
                  ${amount.toLocaleString()}
                </div>
                <div className="text-[8px] font-bold text-slate-500 uppercase">
                  {item.percentage}% of pool
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-slate-800/30 p-3 text-center border-t border-slate-800">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Prizes awarded 24h after tournament close
        </p>
      </div>
    </div>
  );
};

export default PrizeDistribution;
