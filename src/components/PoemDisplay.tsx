import React from 'react';
import { Poem, LayoutMode, ThemeStyle } from '../types';

interface PoemDisplayProps {
  poem: Poem;
  previewMode?: boolean;
  printMode?: boolean;
  forceHorizontal?: boolean;
  className?: string;
}

export const PoemDisplay: React.FC<PoemDisplayProps> = ({ 
  poem, 
  previewMode = false, 
  printMode = false,
  forceHorizontal = false,
  className = '' 
}) => {
  // Theme configuration
  const themeClasses = {
    [ThemeStyle.Classic]: "bg-paper text-ink-900",
    [ThemeStyle.Dark]: "bg-ink-900 text-ink-100",
    [ThemeStyle.Nature]: "bg-[#e8ece6] text-[#3d4c3d]",
  };

  const isVertical = poem.layout === LayoutMode.Vertical;

  // --- Print Layout Strategy ---
  if (printMode) {
    // 1. LONG POEM LAYOUT (Horizontal Flow)
    if (forceHorizontal) {
      return (
        <div className="w-full text-ink-900 block relative">
          {poem.imageUrl && (
            <div className="w-full flex justify-center mb-6 avoid-break">
              <img 
                src={poem.imageUrl} 
                alt="Illustration" 
                className="max-h-[80mm] max-w-[80%] object-contain border-4 border-double border-ink-100 p-2"
              />
            </div>
          )}

          <div className="max-w-3xl mx-auto px-8">
            <div className="text-center mb-4 avoid-break flex flex-col items-center">
              {/* CLEAN TITLE: No borders */}
              <h2 className="font-serif font-bold text-3xl mb-3">{poem.title || "无题"}</h2>
              {poem.author && (
                <div className="font-serif text-ink-600 text-lg">— {poem.author}</div>
              )}
            </div>

            <div className="font-serif text-lg leading-loose tracking-wide whitespace-pre-wrap text-justify">
              {poem.content}
            </div>
          </div>
        </div>
      );
    }

    // 2. SHORT POEM LAYOUT (Artistic Vertical)
    return (
      <div className="w-full text-ink-900 block" style={{ display: 'flow-root' }}>
        {poem.imageUrl && (
          <div className="w-full flex justify-center mb-6 avoid-break">
            <img 
              src={poem.imageUrl} 
              alt="Illustration" 
              className="max-h-[70mm] object-contain"
            />
          </div>
        )}

        <div className="w-full relative px-12">
           <div 
             className={`
               ${isVertical 
                 ? '[writing-mode:vertical-rl] text-left float-right clear-both min-h-[50mm]' 
                 : 'w-full max-w-2xl mx-auto text-center flex flex-col items-center'
               }
             `}
             style={isVertical ? { width: 'auto', maxWidth: '100%' } : {}}
           >
              {/* CLEAN TITLE: No borders */}
              <h2 className={`font-serif font-bold text-3xl leading-snug 
                ${isVertical 
                  ? 'tracking-widest py-2 ml-6 mb-0' 
                  : 'mb-3'
                }`}>
                {poem.title || "无题"}
              </h2>

              {/* Author */}
              {poem.author && (
                <div className={`font-serif text-ink-600 text-lg ${isVertical ? 'tracking-widest mt-8 ml-4' : 'mb-6'}`}>
                  — {poem.author}
                </div>
              )}

              {/* Body */}
              <div className={`font-serif text-lg leading-loose whitespace-pre-wrap ${isVertical ? 'tracking-widest mt-4' : ''}`}>
                {poem.content}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- Web / Preview Layout ---
  const containerClasses = `relative overflow-hidden shadow-2xl transition-all duration-500 flex flex-col ${themeClasses[poem.theme]} ${previewMode ? 'h-full' : 'w-full max-w-2xl mx-auto my-8 rounded-lg'} ${className}`;

  return (
    <div className={containerClasses}>
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-multiply z-0" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Image Section */}
      {poem.imageUrl && (
        <div className={`relative z-10 ${previewMode ? 'h-1/3' : 'h-72 sm:h-96 bg-black/5'} w-full shrink-0 flex items-center justify-center overflow-hidden`}>
          <img 
            src={poem.imageUrl} 
            alt="Poem illustration" 
            className="w-full h-full object-contain opacity-95 transition-transform duration-1000 hover:scale-[1.02]"
          />
        </div>
      )}

      {/* Content Section */}
      <div className={`relative z-10 flex-grow p-4 sm:p-8 flex flex-col items-center w-full ${previewMode ? '' : 'min-h-[450px] overflow-hidden'} ${isVertical ? 'justify-start pt-10' : 'justify-center'}`}>
        <div 
          dir={isVertical ? "rtl" : "ltr"}
          className={`relative max-w-full ${isVertical ? `overflow-x-auto w-full pb-6` : 'w-full flex justify-center'}`}
        >
           <div className={`${isVertical ? 'inline-flex flex-row gap-12 sm:gap-16 h-fit min-w-full px-4 text-left items-start' : 'flex flex-col items-center gap-6 max-w-lg mx-auto py-8 text-center'}`}>
            
            {/* Title Block */}
            <div className={`shrink-0 ${isVertical ? 'flex flex-row items-center' : 'flex flex-col items-center'}`}>
              <h2 dir="ltr" className={`
                font-serif font-bold text-3xl sm:text-4xl text-ink-900
                ${isVertical 
                  ? '[writing-mode:vertical-rl] tracking-[0.2em] py-2 ml-4' 
                  : 'mb-1'
                }
              `}>
                {poem.title || "无题"}
              </h2>
            </div>

            {/* Author */}
            {poem.author && (
              <div dir="ltr" className={`font-serif text-sm sm:text-base opacity-70 shrink-0 ${isVertical ? '[writing-mode:vertical-rl] mt-12 tracking-widest' : 'mb-4'}`}>
                — {poem.author}
              </div>
            )}

            {/* Content */}
            <div dir="ltr" className={`font-serif leading-loose tracking-widest whitespace-pre-wrap shrink-0 ${isVertical ? '[writing-mode:vertical-rl] text-left text-base sm:text-lg' : 'text-base sm:text-lg'}`}>
              {poem.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
