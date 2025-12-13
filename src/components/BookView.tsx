import React from 'react';
import { Poem } from '../types';
import { PoemDisplay } from './PoemDisplay';

interface BookViewProps {
  poems: Poem[];
}

export const BookView: React.FC<BookViewProps> = ({ poems }) => {
  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="print-container hidden bg-white text-ink-900 w-full mx-auto">
      {/* --- Cover Page --- */}
      <div className="book-page flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#434339 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        <div className="z-10 border-4 border-ink-900 p-12 mb-12">
           <h1 className="text-6xl font-calligraphy mb-4">墨韵诗集</h1>
           <p className="text-xl font-serif tracking-[0.5em] uppercase">Ink & Verse</p>
        </div>
        
        <div className="z-10 mt-20 font-serif text-ink-600 space-y-4">
          <p className="text-lg">收录诗歌 {poems.length} 首</p>
          <p className="text-sm border-t border-ink-300 pt-4 w-48 mx-auto">{date}</p>
        </div>

        <div className="absolute bottom-20 opacity-50">
           <div className="w-16 h-16 border-2 border-red-800 text-red-800 rounded-sm flex items-center justify-center transform rotate-6">
             <span className="font-cursive text-lg">珍藏</span>
           </div>
        </div>
      </div>

      {/* --- Table of Contents --- */}
      <div className="book-page p-16 bg-white">
        <h2 className="text-3xl font-serif font-bold text-center mb-12 pb-4 border-b border-ink-200">目录</h2>
        <div className="grid grid-cols-1 gap-x-12 gap-y-4 font-serif content-start">
          {poems.map((poem, index) => (
            <div key={poem.id} className="flex items-baseline justify-between border-b border-dashed border-ink-200 pb-2">
              <span className="text-lg text-ink-900 truncate mr-4">
                <span className="mr-4 text-ink-400 text-sm font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                {poem.title || '无题'}
              </span>
              <span className="text-sm text-ink-500 whitespace-nowrap">{poem.author || '佚名'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- Poem Pages --- */}
      {poems.map((poem, index) => (
        <div key={poem.id} className="book-page flex flex-col items-center justify-center p-8 relative">
           {/* Poem Card scaled slightly to fit margins */}
           <div className="transform scale-90 origin-center w-full max-w-3xl">
              <PoemDisplay poem={poem} printMode={true} className="shadow-none" />
           </div>

           {/* Footer */}
           <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4 text-xs font-serif text-ink-400">
             <span>Ink & Verse</span>
             <span>•</span>
             <span>{index + 1}</span>
           </div>
        </div>
      ))}
    </div>
  );
};