import { Poem } from "../types";

// Dynamic Backend URL for Local Editing
const getBackendUrl = () => {
  let hostname = 'localhost';
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const h = window.location.hostname;
    if (h && h.trim() !== '') {
      hostname = h;
    }
  }
  return `http://${hostname}:3001/api`;
};

const API_URL = getBackendUrl();

export const apiService = {
  // --- Auth ---
  
  verifyPassword: async (password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return response.ok;
    } catch (error) {
      console.warn("Auth check failed (Server likely offline). Falling back to static mode.");
      // In static mode (Vercel), we allow "login" with the default password just to view the UI,
      // but save actions will fail.
      if (password === 'ink') return true; 
      return false;
    }
  },

  updatePassword: async (newPassword: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) throw new Error('Update failed');
    } catch (error) {
       throw new Error("在线浏览模式下无法修改密码，请在本地环境操作。");
    }
  },

  // --- Content ---

  getAllPoems: async (): Promise<Poem[]> => {
    try {
      // 1. Try to fetch from the Node.js API (Local Editing Mode)
      // We set a short timeout so we don't wait too long on Vercel
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout
      
      const response = await fetch(`${API_URL}/poems`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log("Loaded from Local API Server");
        const data = await response.json();
        return sortPoems(data);
      }
      throw new Error("API not ok");

    } catch (error) {
      // 2. Fallback: Fetch the static JSON file (Vercel / Production Mode)
      console.log("API unavailable, fetching static poems.json");
      try {
        // Fetch from the root public path
        const staticResponse = await fetch('/poems.json');
        if (!staticResponse.ok) return [];
        const data = await staticResponse.json();
        return sortPoems(data);
      } catch (staticError) {
        console.error("Failed to load static content:", staticError);
        return [];
      }
    }
  },

  savePoem: async (poem: Poem): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/poems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poem),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }
    } catch (error) {
      console.error(error);
      alert("【温馨提示】\n\n当前处于在线浏览模式（Vercel）。\n由于没有后台服务器，无法在线保存修改。\n\n请在您的本地电脑上运行 'npm start' 和 'node server.js' 进行编辑，然后将 updates 推送到 GitHub。");
      throw error;
    }
  },

  deletePoem: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/poems/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Delete failed");
    } catch (error) {
      alert("【温馨提示】\n\n当前处于在线浏览模式，无法执行删除操作。\n请在本地环境进行管理。");
      throw error;
    }
  }
};

// Helper to sort poems
const sortPoems = (data: any[]): Poem[] => {
  if (!Array.isArray(data)) return [];
  return data.sort((a: Poem, b: Poem) => (b.dateCreated || 0) - (a.dateCreated || 0));
}
