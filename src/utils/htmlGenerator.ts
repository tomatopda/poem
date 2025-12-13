import { Poem, LayoutMode, ThemeStyle } from '../types';

/**
 * Generates a standalone HTML string representing the complete poetry collection.
 * Features:
 * - Interactive Table of Contents with smooth scrolling links
 * - "Back to Top" links after each poem
 * - Exact CSS styling matching the website (via Tailwind CDN)
 * - Embedded Google Fonts
 */
export const generateEbookHtml = (poems: Poem[], siteName: string = "墨韵诗集", siteEnName: string = "Ink & Verse"): string => {
  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // 1. HTML Header with Styles and Fonts
  const headContent = `
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${siteEnName} - ${siteName}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@200;300;400;500;700&family=Zhi+Mang+Xing&display=swap" rel="stylesheet">
      <script>
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                serif: ['"Noto Serif SC"', 'serif'],
                cursive: ['"Ma Shan Zheng"', 'cursive'],
                calligraphy: ['"Zhi Mang Xing"', 'cursive'],
              },
              colors: {
                ink: { 50: '#f7f7f5', 100: '#efefeb', 200: '#dcdcd5', 300: '#bdbdb0', 400: '#9a9a88', 500: '#7d7d6a', 600: '#636353', 700: '#515143', 800: '#434339', 900: '#3a3a31', 950: '#1d1d18' },
                paper: '#fdfbf7',
              }
            }
          }
        }
      </script>
      <style>
        body { background-color: #fdfbf7; color: #1d1d18; scroll-behavior: smooth; }
        .page-container { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem 1rem; border-bottom: 1px dashed #dcdcd5; position: relative; }
        .texture-overlay { position: absolute; inset: 0; opacity: 0.4; pointer-events: none; z-index: 0; mix-blend-mode: multiply; background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E"); }
        .theme-classic { background-color: #fdfbf7; color: #3a3a31; }
        .theme-dark { background-color: #3a3a31; color: #efefeb; }
        .theme-nature { background-color: #e8ece6; color: #3d4c3d; }
      </style>
    </head>
  `;

  // 2. Cover Page
  const coverPage = `
    <div id="top" class="page-container" style="min-height: 100vh;">
      <div class="texture-overlay"></div>
      <div class="z-10 text-center border-8 border-double border-ink-900 p-12 md:p-24 bg-white/50 backdrop-blur-sm shadow-xl">
        <h1 class="text-6xl md:text-8xl font-calligraphy mb-6 text-ink-900">${siteName}</h1>
        <p class="text-2xl font-serif tracking-[0.5em] uppercase text-ink-600">${siteEnName}</p>
      </div>
      <div class="z-10 mt-16 font-serif text-ink-600 space-y-2 text-center">
        <p class="text-xl">收录诗歌 ${poems.length} 首</p>
        <div class="w-16 h-1 bg-ink-300 mx-auto my-4"></div>
        <p class="text-sm">${date}</p>
      </div>
      <a href="#toc" class="z-10 mt-12 px-6 py-2 border border-ink-400 rounded-full text-ink-500 hover:bg-ink-800 hover:text-white transition-colors font-serif">
        点击开启阅读
      </a>
    </div>
  `;

  // 3. Table of Contents (Hyperlinked)
  const tocItems = poems.map((poem, index) => `
    <a href="#poem-${poem.id}" class="group block p-4 border-b border-ink-200 hover:bg-ink-50 transition-colors no-underline">
      <div class="flex items-baseline justify-between">
        <span class="text-lg font-serif font-bold text-ink-800 group-hover:text-ink-600 transition-colors truncate pr-4">
          <span class="inline-block w-8 text-ink-300 font-mono text-sm">${(index + 1).toString().padStart(2, '0')}</span>
          ${poem.title || '无题'}
        </span>
        <span class="text-sm font-serif text-ink-400 shrink-0">${poem.author || '佚名'}</span>
      </div>
    </a>
  `).join('');

  const tocPage = `
    <div id="toc" class="page-container items-stretch max-w-3xl mx-auto w-full">
      <div class="texture-overlay"></div>
      <div class="z-10 bg-white/80 p-8 md:p-12 shadow-sm rounded-lg">
        <h2 class="text-4xl font-serif font-bold text-center mb-12 pb-4 border-b-2 border-ink-800">目录</h2>
        <div class="space-y-2">
          ${tocItems}
        </div>
        <div class="mt-12 text-center">
             <p class="text-ink-400 text-sm font-serif">点击标题跳转至对应诗篇</p>
        </div>
      </div>
    </div>
  `;

  // 4. Poem Pages
  const poemPages = poems.map((poem) => {
    const isVertical = poem.layout === LayoutMode.Vertical;
    const themeClass = `theme-${poem.theme}`;
    const sealColor = poem.theme === ThemeStyle.Dark ? 'border-red-400 text-red-400' : 'border-red-800 text-red-800';
    
    // Vertical specific styles
    const contentWrapperClass = isVertical 
      ? 'flex-row-reverse overflow-x-auto justify-center' // Reverse row for RTL feel in vertical
      : 'flex-col items-center max-w-2xl mx-auto';
    
    const writingMode = isVertical ? 'vertical-rl' : 'horizontal-tb';
    const textAlign = isVertical ? 'left' : 'center'; // Vertical text aligns top-left relative to line
    const titleClass = isVertical 
      ? 'tracking-[0.2em] py-2 ml-12' 
      : 'text-4xl sm:text-5xl mb-6 pb-4';
    
    const authorClass = isVertical
        ? 'mt-16 tracking-widest ml-4 opacity-70'
        : 'mb-8 opacity-70';

    const bodyClass = isVertical
        ? 'tracking-widest leading-loose text-lg'
        : 'text-lg leading-loose tracking-wide whitespace-pre-wrap';

    const imageSection = poem.imageUrl 
      ? `<div class="mb-12 max-h-[50vh] flex justify-center overflow-hidden rounded-sm shadow-inner">
           <img src="${poem.imageUrl}" class="max-h-full object-contain opacity-95" alt="illustration" />
         </div>` 
      : '';

    return `
      <div id="poem-${poem.id}" class="page-container ${themeClass}">
        <div class="texture-overlay"></div>
        
        <div class="z-10 w-full max-w-5xl mx-auto p-4 md:p-8">
           ${imageSection}
           
           <div class="flex ${isVertical ? 'justify-center' : 'justify-center'} w-full">
             <div class="relative p-8 md:p-12 ${isVertical ? 'inline-block' : 'block w-full text-center'}">
                
                <div style="writing-mode: ${writingMode}; text-align: ${textAlign};" class="${isVertical ? 'h-[60vh] max-h-[800px]' : ''}">
                    <!-- Title -->
                    <h2 class="font-serif font-bold text-3xl md:text-4xl ${titleClass}">
                        ${poem.title || "无题"}
                    </h2>

                    <!-- Author -->
                    ${poem.author ? `<div class="font-serif text-ink-600 text-lg ${authorClass}">— ${poem.author}</div>` : ''}

                    <!-- Content -->
                    <div class="font-serif ${bodyClass}">
                        ${poem.content}
                    </div>
                </div>

             </div>
           </div>
        </div>

        <!-- Navigation Footer -->
        <div class="z-10 mt-12 flex gap-4 text-sm font-serif opacity-50 hover:opacity-100 transition-opacity">
            <a href="#toc" class="hover:underline">↑ 返回目录</a>
            <span>•</span>
            <a href="#top" class="hover:underline">↑ 回到封面</a>
        </div>
      </div>
    `;
  }).join('');

  // 5. Assemble Full HTML
  return `
    <!DOCTYPE html>
    <html lang="zh-CN" class="scroll-smooth">
      ${headContent}
      <body>
        ${coverPage}
        ${tocPage}
        ${poemPages}
        
        <!-- Global Footer -->
        <div class="py-8 text-center text-ink-300 text-xs font-serif bg-ink-950">
            <p>Generated by ${siteEnName}</p>
        </div>
      </body>
    </html>
  `;
};
