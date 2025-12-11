import React, { useState, useRef, useEffect } from 'react';
import { LayoutMode, Poem, ThemeStyle } from '../types';
import { PoemDisplay } from './PoemDisplay';
import { Button } from './Button';
import { compressImage } from '../utils/imageUtils';

interface EditorProps {
  onSave: (poem: Poem) => Promise<void>; // Updated to return Promise for loading state
  onCancel: () => void;
  initialData?: Poem | null;
}

export const Editor: React.FC<EditorProps> = ({ onSave, onCancel, initialData }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [layout, setLayout] = useState<LayoutMode>(LayoutMode.Vertical);
  const [theme, setTheme] = useState<ThemeStyle>(ThemeStyle.Classic);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  // Loading states
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state from initialData if provided
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setAuthor(initialData.author);
      setContent(initialData.content);
      setLayout(initialData.layout);
      setTheme(initialData.theme);
      setImageUrl(initialData.imageUrl);
    }
  }, [initialData]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const compressedDataUrl = await compressImage(file);
        setImageUrl(compressedDataUrl);
      } catch (error) {
        console.error("Image processing failed:", error);
        alert("图片处理失败，请尝试其他图片");
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleSave = async () => {
    // 1. Validation Check
    if (!content.trim()) {
      alert("请填写诗歌内容后再保存。");
      return;
    }

    setIsSaving(true);

    try {
      // Use existing analysis or default placeholder (AI removed)
      const analysis = initialData?.analysis || {
        mood: "未知",
        commentary: "自作诗篇，意在言外。",
        suggestedTags: ["原创"]
      };

      const newPoem: Poem = {
        id: initialData?.id || crypto.randomUUID(), // Use existing ID if editing
        title,
        author,
        content,
        imageUrl,
        layout,
        theme,
        dateCreated: initialData?.dateCreated || Date.now(), // Preserve creation date
        analysis
      };

      // 2. Await the save operation
      await onSave(newPoem);
    } catch (error) {
      console.error("Save failed in editor", error);
      // Alert handled in parent, but good to have safety
    } finally {
      setIsSaving(false);
    }
  };

  // Preview Poem Object (Reactive)
  const previewPoem: Poem = {
    id: 'preview',
    title: title || '标题',
    author: author || '作者',
    content: content || '在此输入诗歌内容...\n支持换行',
    imageUrl,
    layout,
    theme,
    dateCreated: Date.now()
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-ink-50">
      
      {/* Left: Controls */}
      <div className="w-full lg:w-1/3 p-6 overflow-y-auto border-r border-ink-200 bg-white flex flex-col gap-6 shadow-xl z-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-serif text-ink-900 font-bold">{initialData ? '编辑诗歌' : '创作诗歌'}</h2>
          <Button variant="ghost" onClick={onCancel} className="text-sm">返回</Button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">标题</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="无题"
              className="w-full bg-ink-50 border-none rounded-md p-3 focus:ring-2 focus:ring-ink-300 outline-none font-serif text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">作者</label>
            <input 
              type="text" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="你的名字 (可选)"
              className="w-full bg-ink-50 border-none rounded-md p-3 focus:ring-2 focus:ring-ink-300 outline-none font-serif"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">内容 *</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              placeholder="明月几时有..."
              rows={8}
              className="w-full bg-ink-50 border-none rounded-md p-3 focus:ring-2 focus:ring-ink-300 outline-none font-serif resize-none text-lg leading-relaxed"
            />
          </div>
        </div>

        <div className="border-t border-ink-100 pt-6 space-y-6">
          {/* Style Controls */}
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">排版 & 主题</label>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setLayout(LayoutMode.Vertical)}
                className={`flex-1 py-2 rounded-md text-sm transition-colors ${layout === LayoutMode.Vertical ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
              >
                竖排 (Vertical)
              </button>
              <button 
                onClick={() => setLayout(LayoutMode.Horizontal)}
                className={`flex-1 py-2 rounded-md text-sm transition-colors ${layout === LayoutMode.Horizontal ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
              >
                横排 (Horizontal)
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[ThemeStyle.Classic, ThemeStyle.Nature, ThemeStyle.Dark].map((t) => (
                 <button
                   key={t}
                   onClick={() => setTheme(t)}
                   className={`h-10 rounded-md border-2 transition-all ${theme === t ? 'border-ink-800 scale-95' : 'border-transparent hover:scale-105'}`}
                   style={{
                     backgroundColor: t === ThemeStyle.Classic ? '#fdfbf7' : t === ThemeStyle.Dark ? '#3a3a31' : '#e8ece6'
                   }}
                   title={t}
                 />
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
             <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">插画 (可选)</label>
             <input 
               type="file" 
               accept="image/*" 
               onChange={handleImageUpload} 
               ref={fileInputRef}
               className="hidden"
             />
             <div className="flex items-center gap-3">
               <Button 
                 variant="secondary" 
                 onClick={() => fileInputRef.current?.click()} 
                 className="text-sm py-2"
                 isLoading={isProcessingImage}
               >
                 {imageUrl ? '更换图片' : '上传图片'}
               </Button>
               {imageUrl && (
                 <button onClick={() => setImageUrl(undefined)} className="text-xs text-red-500 hover:underline">
                   清除
                 </button>
               )}
             </div>
             {isProcessingImage && <p className="text-xs text-ink-400 mt-2">正在压缩优化图片...</p>}
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Button 
            onClick={handleSave} 
            className="w-full py-4 text-lg shadow-xl" 
            isLoading={isProcessingImage || isSaving}
            disabled={isSaving}
          >
            {isSaving ? '正在提交...' : (initialData ? '更新作品' : '完成创作')}
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="hidden lg:flex w-2/3 items-center justify-center bg-ink-200 p-8 overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#434339 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="h-full w-full flex items-center justify-center scale-90">
           <PoemDisplay poem={previewPoem} previewMode />
        </div>
      </div>

      {/* Mobile Preview Indicator */}
      <div className="lg:hidden p-4 bg-ink-100 text-center text-xs text-ink-500">
        预览请在保存后查看
      </div>
    </div>
  );
};