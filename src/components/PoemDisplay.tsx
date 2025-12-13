import React from 'react';
import { Poem, LayoutMode, ThemeStyle } from '../types';

interface PoemDisplayProps {
  poem: Poem;
  previewMode?: boolean;
  printMode?: boolean;
  className?: string;
}

export const PoemDisplay: React.FC<PoemDisplayProps> = ({ 
  poem, 
  previewMode = false, 
  printMode = false,
  className = '' 
}) => {
  // Theme configuration
  const themeClasses = {
    [ThemeStyle.Classic]: "bg-paper text-ink-900",
    [ThemeStyle.Dark]: "bg-ink-900 text-ink-100",
    [ThemeStyle.Nature]: "bg-[#e8ece6] text-[#3d4c3d]", // Sage green tint
  };

  const isVertical = poem.layout === LayoutMode.Vertical;

  return (
    <div 
      className={`relative overflow-hidden transition-all duration-500 flex flex-col ${themeClasses[poem.theme]} 
      ${previewMode ? 'h-full' : ''} 
      ${printMode ? 'w-full h-full border border-ink-200' : 'w-full max-w-2xl mx-auto rounded-lg my-8 shadow-2xl'}
      ${className}`}
    >
      {/* Texture Overlay - 在打印模式下降低不透明度或保持原样 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-multiply z-0" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Image Section */}
      {poem.imageUrl && (
        <div className={`relative z-10 ${previewMode ? 'h-1/3' : (printMode ? 'h-64' : 'h-72 sm:h-96 bg-black/5')} w-full shrink-0 flex items-center justify-center overflow-hidden`}>
          <img 
            src={poem.imageUrl} 
            alt="Poem illustration" 
            className="w-full h-full object-contain opacity-95"
          />
        </div>
      )}

      {/* Content Section */}
      <div className={`relative z-10 flex-grow p-4 sm:p-8 flex flex-col items-center w-full 
        ${previewMode ? '' : (printMode ? 'overflow-visible' : 'min-h-[450px] overflow-hidden')} 
        ${isVertical ? 'justify-start pt-10' : 'justify-center'}`}
      >
        
        {/* Scrollable Container */}
        <div 
          dir={isVertical ? "rtl" : "ltr"}
          className={`
            relative max-w-full
            ${isVertical 
              ? `w-full pb-6` 
              : 'w-full flex justify-center'
            }
          `}
        >
           <div className={`
             ${isVertical 
               ? 'inline-flex flex-row gap-12 sm:gap-16 h-fit min-w-full px-4 text-left items-start'
               : 'flex flex-col items-center gap-8 max-w-lg mx-auto py-8 text-center'
             }
           `}>
            
            {/* Title */}
            <h2 
              dir="ltr"
              className={`
              font-serif leading-tight shrink-0 text-3xl sm:text-4xl font-bold
              ${isVertical 
                ? '[writing-mode:vertical-rl] border-l-4 border-current pl-6 tracking-[0.2em] py-2' 
                : 'text-4xl sm:text-5xl mb-4'
              }
            `}>
              {poem.title || "无题"}
            </h2>

            {/* Author */}
            {poem.author && (
              <div 
                dir="ltr"
                className={`
                font-serif text-sm sm:text-base opacity-70 shrink-0
                ${isVertical ? '[writing-mode:vertical-rl] mt-16 tracking-widest' : 'mb-6'}
              `}>
                — {poem.author}
              </div>
            )}

            {/* Poem Content Body */}
            <div 
              dir="ltr"
              className={`
              font-serif leading-loose tracking-widest whitespace-pre-wrap shrink-0
              ${isVertical 
                ? '[writing-mode:vertical-rl] text-left text-base sm:text-lg' 
                : 'text-base sm:text-lg'
              }
            `}>
              {poem.content}
            </div>
          </div>
        </div>

        {/* Decorative Seal */}
        <div className={`mt-8 pt-4 opacity-80 ${isVertical ? 'self-end mr-8' : ''}`}>
           <div className={`w-12 h-12 border-2 ${poem.theme === ThemeStyle.Dark ? 'border-red-400 text-red-400' : 'border-red-800 text-red-800'} rounded-sm flex items-center justify-center transform rotate-6 shadow-sm`}>
             <span className="font-cursive text-sm select-none">墨韵</span>
           </div>
        </div>

      </div>
    </div>
  );
};