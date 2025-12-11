import React, { useState, useEffect } from 'react';
import { Poem, ViewState } from './types';
import { Editor } from './components/Editor';
import { PoemDisplay } from './components/PoemDisplay';
import { Button } from './components/Button';
import { PasswordModal } from './components/PasswordModal';
import { apiService } from './services/apiService';

export default function App() {
  const [view, setView] = useState<ViewState>('gallery');
  const [poems, setPoems] = useState<Poem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
  
  // Auth & Security state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Load poems from Server on mount
  useEffect(() => {
    loadPoems();
  }, []);

  const loadPoems = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAllPoems();
      setPoems(data);
    } catch (error) {
      console.error("Failed to load poems from server:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminEntry = () => {
    if (isAuthenticated) {
      setView('admin');
    } else {
      setShowPasswordModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setView('admin'); // Go straight to admin dashboard on success
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    try {
      await apiService.updatePassword(newPassword);
      alert('密码修改成功');
      setIsChangingPassword(false);
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || '修改失败');
    }
  };

  const handleSavePoem = async (poem: Poem) => {
    try {
      // Send to Server
      await apiService.savePoem(poem);
      
      // Reload list from server to ensure synchronization
      await loadPoems();

      setView('admin');
      setSelectedPoem(null);
    } catch (error) {
      console.error("Failed to save poem:", error);
      alert("保存失败：无法连接到服务器或文件写入错误。请确保 node server.js 正在运行。");
    }
  };

  const deletePoem = async (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (window.confirm('确定要永久删除这首诗吗？这将直接修改服务器上的文件。')) {
      try {
        // Delete from Server
        await apiService.deletePoem(id);
        
        // Update Local State directly for speed, or reload
        setPoems(prev => prev.filter(p => p.id !== id));
        
        if (selectedPoem?.id === id) {
          setSelectedPoem(null);
          if (view === 'details') setView('gallery');
        }
      } catch (error) {
        console.error("Failed to delete poem:", error);
        alert("删除失败，请检查服务器连接。");
      }
    }
  };

  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-ink-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 select-none">
        {/* Hidden Admin Trigger: Double Click the Logo. Hint removed. */}
        <div 
          className="w-8 h-8 bg-ink-900 rounded-sm flex items-center justify-center text-paper font-serif font-bold text-lg cursor-pointer hover:bg-ink-800 transition-colors"
          onDoubleClick={handleAdminEntry}
        >
          墨
        </div>
        <div 
          className="cursor-pointer"
          onClick={() => {
            setSelectedPoem(null);
            setView('gallery');
          }}
        >
          <h1 className="text-xl font-serif font-bold tracking-widest text-ink-900">Ink & Verse</h1>
        </div>
      </div>
      
      {view === 'admin' && (
        <Button variant="ghost" onClick={() => setView('gallery')} className="text-sm">
          退出后台
        </Button>
      )}
    </header>
  );

  const renderGallery = () => (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-calligraphy text-ink-800">诗意栖居</h2>
        <p className="text-ink-500 font-serif max-w-md mx-auto">
          Collecting fragments of thought, rendered in ink and pixels.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-ink-400">
           <svg className="animate-spin h-8 w-8 text-ink-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-serif">正在连接服务器获取诗集...</p>
        </div>
      ) : poems.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          <p className="mb-6 font-serif text-lg">暂无诗篇。</p>
          <p className="text-sm">服务器 poems.json 为空。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {poems.map(poem => (
            <div 
              key={poem.id} 
              onClick={() => {
                setSelectedPoem(poem);
                setView('details');
              }}
              className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-ink-100 hover:border-ink-300 transform hover:-translate-y-1"
            >
              <div className="h-48 overflow-hidden bg-ink-100 relative">
                {poem.imageUrl ? (
                  <img src={poem.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={poem.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-300 bg-ink-50">
                    <span className="font-calligraphy text-4xl opacity-20">墨</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 text-xs font-serif rounded backdrop-blur-sm shadow-sm">
                   {poem.layout === 'vertical' ? '竖排' : '横排'}
                </div>
              </div>
              
              <div className="p-6 flex flex-col h-auto">
                <h3 className="text-xl font-bold font-serif text-ink-900 mb-1 truncate">{poem.title || '无题'}</h3>
                <p className="text-sm text-ink-500 font-serif mb-4 h-5">{poem.author ? `— ${poem.author}` : ''}</p>
                <div className="mt-auto pt-4 border-t border-ink-100">
                   <p className="font-serif text-ink-700 text-base whitespace-pre-line leading-relaxed line-clamp-3">
                     {poem.content ? poem.content.split('\n').slice(0, 3).join('\n') : ''}
                   </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );

  const renderAdmin = () => (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-ink-900">后台管理</h2>
          <p className="text-ink-500 mt-1">管理诗集内容 (共 {poems.length} 首) - 已连接服务器</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <Button variant="secondary" onClick={() => setIsChangingPassword(!isChangingPassword)}>
            {isChangingPassword ? '取消修改' : '修改密码'}
          </Button>
          <Button onClick={() => { setSelectedPoem(null); setView('editor'); }}>
            + 新建诗歌
          </Button>
        </div>
      </div>

      {isChangingPassword && (
        <div className="mb-8 p-6 bg-ink-50 rounded-lg border border-ink-200 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handlePasswordUpdate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">设置新密码</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                className="w-full p-2 rounded border border-ink-200 focus:ring-2 focus:ring-ink-300 outline-none"
              />
            </div>
            <Button type="submit" disabled={!newPassword}>确认修改</Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-ink-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ink-50 text-ink-600 font-serif text-sm uppercase tracking-wider border-b border-ink-200">
              <th className="p-4 w-20">封面</th>
              <th className="p-4">标题</th>
              <th className="p-4">作者</th>
              <th className="p-4 hidden sm:table-cell">创建时间</th>
              <th className="p-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {poems.map(poem => (
              <tr key={poem.id} className="hover:bg-ink-50/50 transition-colors">
                <td className="p-4">
                  <div className="w-10 h-10 bg-ink-100 rounded overflow-hidden">
                    {poem.imageUrl ? (
                      <img src={poem.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-300 text-xs">无</div>
                    )}
                  </div>
                </td>
                <td className="p-4 font-serif font-bold text-ink-900">{poem.title || '无题'}</td>
                <td className="p-4 font-serif text-ink-600">{poem.author || '-'}</td>
                <td className="p-4 font-serif text-ink-400 text-sm hidden sm:table-cell">
                  {new Date(poem.dateCreated).toLocaleDateString()}
                </td>
                <td className="p-4 text-right space-x-2">
                   <button 
                     onClick={() => { setSelectedPoem(poem); setView('editor'); }}
                     className="text-sm text-ink-600 hover:text-ink-900 font-serif hover:underline"
                   >
                     编辑
                   </button>
                   <button 
                     onClick={(e) => deletePoem(poem.id, e)}
                     className="text-sm text-red-400 hover:text-red-700 font-serif hover:underline"
                   >
                     删除
                   </button>
                </td>
              </tr>
            ))}
            {poems.length === 0 && (
               <tr>
                 <td colSpan={6} className="p-8 text-center text-ink-400 font-serif">
                   暂无内容，请点击右上角新建。
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-ink-50 rounded-lg border border-ink-200 text-sm text-ink-600 font-serif">
        <h4 className="font-bold mb-2">服务器模式运行中</h4>
        <p>所有数据直接读写至服务器根目录下的 <code>poems.json</code>。</p>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="h-screen bg-ink-50 flex flex-row overflow-hidden">
      
      {/* Sidebar: Title & Navigation (Fixed Left) */}
      <div className="w-16 md:w-24 shrink-0 flex flex-col items-center py-6 border-r border-ink-200 bg-paper z-30 h-full">
        {/* Admin Trigger (Logo). Hint removed. */}
        <div 
          className="w-8 h-8 md:w-10 md:h-10 bg-ink-900 rounded-sm flex items-center justify-center text-paper font-serif font-bold text-lg md:text-xl cursor-pointer hover:bg-ink-800 transition-colors mb-8 shrink-0"
          onDoubleClick={handleAdminEntry}
        >
          墨
        </div>

        {/* Vertical Site Title */}
        <h1 
          className="font-serif font-bold text-ink-900 text-lg tracking-[0.3em] select-none opacity-80" 
          style={{ writingMode: 'vertical-rl' }}
        >
          Ink & Verse
        </h1>

        {/* Decorative Divider */}
        <div className="flex-1 w-[1px] bg-gradient-to-b from-transparent via-ink-200 to-transparent my-6"></div>

        {/* Vertical Return Button */}
        <button 
          onClick={() => setView('gallery')}
          className="group flex flex-col items-center gap-4 opacity-60 hover:opacity-100 transition-all duration-300 pb-4 shrink-0"
          title="返回列表"
        >
          <span className="font-serif text-lg font-bold text-ink-800 tracking-[0.4em] select-none" style={{ writingMode: 'vertical-rl' }}>
            返回诗集
          </span>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-ink-300 group-hover:border-ink-800 flex items-center justify-center text-ink-500 group-hover:text-ink-800 transition-colors bg-white">
            <span className="text-base md:text-lg">←</span>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto bg-ink-50 flex justify-center items-start p-2 sm:p-6 md:p-10">
        <div className="w-full max-w-5xl">
          {selectedPoem && (
            <PoemDisplay 
              poem={selectedPoem} 
              className="!my-0 !mt-0 shadow-2xl" 
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper text-ink-900 font-sans selection:bg-ink-200">
      {/* Hide standard header in details/editor view */}
      {view !== 'editor' && view !== 'details' && renderHeader()}
      
      {view === 'gallery' && renderGallery()}
      
      {view === 'admin' && renderAdmin()}

      {view === 'editor' && (
        <Editor 
          onSave={handleSavePoem} 
          onCancel={() => {
              setView(isAuthenticated ? 'admin' : 'gallery'); 
          }} 
          initialData={selectedPoem} 
        />
      )}
      
      {view === 'details' && renderDetails()}

      <PasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}