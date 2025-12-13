import React from 'react';
import { Poem } from '../types';
import { PoemDisplay } from './PoemDisplay';

interface BookViewProps {
  poems: Poem[];
  siteName: string;
  siteEnName: string;
}

export const BookView: React.FC<BookViewProps> = ({ poems, siteName, siteEnName }) => {
  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Helper: Estimate if a poem is "Long" (likely to exceed 1 page in Vertical mode)
  // Vertical layout consumes horizontal width quickly.
  // Heuristic: If content length > 140 chars OR line count > 12, treat as long.
  const isLongPoem = (content: string): boolean => {
    if (!content) return false;
    const len = content.length;
    const lines = content.split('\n').length;
    // Thresholds: Adjust these based on font-size in PoemDisplay
    return len > 140 || lines > 14; 
  };

  return (
    <div className="print-only">
      {/* Global Print Footer (Fixed on every page) */}
      <div className="print-footer">
        {siteEnName} • {siteName}
      </div>

      {/* --- Cover Page --- */}
      <div className="flex flex-col items-center justify-center min-h-[90vh] text-center page-break">
        <div className="border-8 border-double border-ink-900 p-16 mb-12">
           <h1 className="text-6xl font-calligraphy mb-4">{siteName}</h1>
           <p className="text-xl font-serif tracking-[0.5em] uppercase">{siteEnName}</p>
        </div>
        
        <div className="mt-20 font-serif text-ink-600 space-y-4">
          <p className="text-lg">收录诗歌 {poems.length} 首</p>
          <p className="text-sm border-t border-ink-300 pt-4 w-48 mx-auto">{date}</p>
        </div>
      </div>

      {/* --- Table of Contents --- */}
      <div className="py-12 px-8 page-break">
        <h2 className="text-3xl font-serif font-bold text-center mb-12 pb-4 border-b border-ink-200">目录</h2>
        <div className="grid grid-cols-1 gap-y-4 font-serif">
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
      {poems.map((poem) => {
        const forceHorizontal = isLongPoem(poem.content);
        return (
          <div key={poem.id} className="page-break py-12 block">
             <PoemDisplay 
                poem={poem} 
                printMode={true} 
                forceHorizontal={forceHorizontal}
             />
          </div>
        );
      })}
    </div>
  );
};
