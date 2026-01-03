
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MylCard, UserCollectionItem, ScanResult } from './types';
import { db } from './services/db';
import Scanner from './components/Scanner';
import CardItem from './components/CardItem';
import CardModal from './components/CardModal';

const App: React.FC = () => {
  const [catalog, setCatalog] = useState<MylCard[]>([]);
  const [library, setLibrary] = useState<UserCollectionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<MylCard | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [view, setView] = useState<'all' | 'aliados' | 'otros'>('all');
  const [isInitializing, setIsInitializing] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize DB and load data
  useEffect(() => {
    const init = async () => {
      await db.init();
      refreshData();
    };
    init();
  }, []);

  const refreshData = async () => {
    const cat = await db.getAllCatalog();
    const lib = await db.getLibrary();
    setCatalog(cat);
    setLibrary(lib);
    setIsInitializing(false);
  };

  const handleScanResults = async (results: ScanResult[]) => {
    const newLibItems: UserCollectionItem[] = [];
    
    for (const res of results) {
      const catalogId = `${res.name}-${res.edition}`.replace(/\s+/g, '-').toLowerCase();
      
      let existing = await db.getFromCatalog(catalogId);
      if (!existing) {
        existing = {
          ...res,
          id: catalogId,
          metadataFetched: false
        };
        await db.saveToCatalog(existing);
        setCatalog(prev => [...prev, existing!]);
      }

      const libItem: UserCollectionItem = {
        id: Math.random().toString(36).substr(2, 9),
        cardId: catalogId,
        dateAdded: Date.now()
      };
      await db.addToLibrary(libItem);
      newLibItems.push(libItem);
    }

    setLibrary(prev => [...newLibItems, ...prev]);
    setShowScanner(false);
  };

  const updateCatalogCard = async (updated: MylCard) => {
    await db.saveToCatalog(updated);
    setCatalog(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedCard(updated);
  };

  const deleteFromLibrary = async (libId: string) => {
    await db.removeFromLibrary(libId);
    setLibrary(prev => prev.filter(item => item.id !== libId));
    setSelectedCard(null);
  };

  const exportDB = async () => {
    const json = await db.exportDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myl-library-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await db.importDatabase(event.target?.result as string);
        await refreshData();
        alert("Library restored successfully!");
      } catch (err) {
        alert("Failed to restore library. Invalid file.");
      }
    };
    reader.readAsText(file);
  };

  const filteredLibraryCards = useMemo(() => {
    let result = library.map(item => {
      const card = catalog.find(c => c.id === item.cardId);
      return { ...card, libId: item.id } as (MylCard & { libId: string });
    }).filter(c => !!c.id);

    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowSearch) || 
        c.edition.toLowerCase().includes(lowSearch)
      );
    }
    
    if (view === 'aliados') {
        result = result.filter(c => c.type?.toLowerCase().includes('aliado'));
    } else if (view === 'otros') {
        result = result.filter(c => !c.type?.toLowerCase().includes('aliado'));
    }
    
    return result;
  }, [library, catalog, searchTerm, view]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-amber-500 font-mythical animate-pulse">Waking up IndexedDB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/20">
              <span className="font-mythical text-2xl text-white">M</span>
            </div>
            <div>
              <h1 className="font-mythical text-2xl text-amber-100 tracking-wider">MylLibrary</h1>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Local IndexedDB Online</p>
              </div>
            </div>
          </div>

          <div className="flex-grow max-w-md w-full relative">
            <input 
              type="text" 
              placeholder="Search your collection..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-full px-5 py-2 pl-12 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button 
            onClick={() => setShowScanner(!showScanner)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-6 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-amber-900/20 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Scan Cards
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 flex-grow w-full">
        {showScanner && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-mythical text-amber-500">Scan & Catalog</h2>
               <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
             </div>
             <Scanner onResults={handleScanResults} />
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
                { id: 'all', label: `Collection (${library.length})` },
                { id: 'aliados', label: 'Aliados' },
                { id: 'otros', label: 'Others' }
            ].map(f => (
                <button 
                    key={f.id}
                    onClick={() => setView(f.id as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                        view === f.id 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-sm shadow-amber-500/10' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                >
                    {f.label}
                </button>
            ))}
        </div>

        {filteredLibraryCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredLibraryCards.map(card => (
              <CardItem 
                key={card.libId} 
                card={card} 
                onClick={(c) => setSelectedCard({ ...c, libId: card.libId } as any)} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-600">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
            </div>
            <p className="text-xl font-mythical text-slate-500">Your Library is Empty</p>
            <p className="text-sm mt-2 opacity-60">Scan a photo to start building your database.</p>
          </div>
        )}
      </main>

      {selectedCard && (
        <CardModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
          onUpdate={updateCatalogCard}
          onDelete={() => deleteFromLibrary((selectedCard as any).libId)}
        />
      )}

      <footer className="mt-auto border-t border-slate-900 bg-slate-950/50 backdrop-blur-sm p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs gap-6">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Vault Stats</span>
                <span className="text-amber-500 font-bold text-sm">{catalog.length} <span className="text-slate-600 font-normal">Known Cards</span></span>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="flex flex-col">
                <span className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Collection</span>
                <span className="text-amber-500 font-bold text-sm">{library.length} <span className="text-slate-600 font-normal">Owned</span></span>
              </div>
           </div>

           <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50">
              <button 
                onClick={exportDB} 
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 hover:bg-amber-500/5 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Backup
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="hover:text-amber-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 hover:bg-amber-500/5 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Restore Library
              </button>
              
              <input type="file" ref={fileInputRef} onChange={importDB} accept=".json" className="hidden" />

              <div className="w-px h-6 bg-slate-800 mx-1"></div>

              <button 
                onClick={async () => { if(confirm('Permanently wipe all database records?')) { await db.clearAll(); window.location.reload(); } }} 
                className="text-red-900 hover:text-red-400 transition-colors px-3 py-1.5"
              >
                Clear Database
              </button>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
