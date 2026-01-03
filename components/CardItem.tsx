
import React from 'react';
import { MylCard } from '../types';

interface CardItemProps {
  card: MylCard;
  onClick: (card: MylCard) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, onClick }) => {
  return (
    <div 
      onClick={() => onClick(card)}
      className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-amber-500/10"
    >
      <div className="aspect-[3/4] bg-slate-900 relative flex items-center justify-center overflow-hidden">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="text-slate-700 font-mythical text-4xl">MYL</div>
        )}
        <div className="absolute top-2 right-2">
            {card.metadataFetched ? (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 backdrop-blur-sm">Synced</span>
            ) : (
                <span className="bg-slate-500/20 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-500/30 backdrop-blur-sm">Local</span>
            )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-mythical text-amber-100 text-sm truncate">{card.name}</h3>
        <p className="text-slate-400 text-xs truncate mt-1">{card.edition}</p>
        <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-tighter">{card.type || 'Desconocido'}</span>
            {card.cost !== undefined && (
                <span className="w-5 h-5 rounded-full bg-amber-900/50 flex items-center justify-center text-[10px] border border-amber-500/30 text-amber-200">
                    {card.cost}
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default CardItem;
