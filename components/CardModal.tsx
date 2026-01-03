
import React, { useState } from 'react';
import { MylCard } from '../types';
import { fetchCardMetadata } from '../services/geminiService';

interface CardModalProps {
  card: MylCard;
  onClose: () => void;
  onUpdate: (updatedCard: MylCard) => void;
  onDelete: (id: string) => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, onClose, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    setImgError(false);
    try {
      const metadata = await fetchCardMetadata(card.name, card.edition);
      if (metadata) {
        onUpdate({
          ...card,
          ...metadata,
          metadataFetched: true
        });
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col md:flex-row">
          {/* Card Image Sidebar */}
          <div className="w-full md:w-2/5 bg-slate-950 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
             <div className="w-full aspect-[3/4] rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800/50 shadow-2xl relative group">
                {card.imageUrl && !imgError ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.name} 
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-slate-800 font-mythical text-6xl">MYL</div>
                      {imgError && <p className="text-[10px] text-red-400 font-medium">Image link broken</p>}
                    </div>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
             </div>
          </div>

          {/* Card Details */}
          <div className="w-full md:w-3/5 p-8 flex flex-col max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-mythical text-amber-100 leading-tight tracking-wide">{card.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-amber-500 font-bold uppercase tracking-widest text-xs">{card.edition}</p>
                  <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                  <span className="text-slate-400 text-xs font-medium">{card.type}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 -mr-2 text-slate-500 hover:text-white transition-colors bg-slate-800/50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-8 space-y-6 flex-grow">
              {card.race && (
                  <div className="inline-flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-tighter">Raza</span>
                    <span className="text-xs text-amber-200 font-bold">{card.race}</span>
                  </div>
              )}

              <div className="relative">
                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500/30 rounded-full"></div>
                {card.ability ? (
                  <p className="text-sm text-slate-300 italic leading-relaxed pl-4">
                    "{card.ability}"
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 italic pl-4">No ability text found. Tap "Sync with Wiki" to retrieve data from the official database.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30 group hover:border-amber-500/30 transition-colors">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Fuerza</div>
                  <div className="text-2xl font-mythical text-amber-500">{card.strength ?? '—'}</div>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30 group hover:border-amber-500/30 transition-colors">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Coste</div>
                  <div className="text-2xl font-mythical text-amber-500">{card.cost ?? '—'}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
                {card.rarity && (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="text-slate-600 font-bold uppercase tracking-widest">Frecuencia:</span>
                    <span className="text-slate-200 font-semibold">{card.rarity}</span>
                  </div>
                )}
                
                {card.sourceUrl && (
                  <a 
                      href={card.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 group transition-colors"
                  >
                      <span>Consult official Wiki database</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                  </a>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex gap-4">
              <button 
                onClick={handleSync}
                disabled={loading}
                className="flex-grow flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-amber-900/10 active:scale-[0.98]"
              >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                )}
                {card.metadataFetched ? 'Update Database' : 'Sync with Global DB'}
              </button>
              <button 
                onClick={() => { if(confirm('Delete from your library?')) onDelete(card.id); }}
                className="px-5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-2xl transition-all border border-slate-700/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
