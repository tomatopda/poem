const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto'); // Native Node.js crypto module

const app = express();
const PORT = 3001; 

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- IMPORTANT CHANGE ---
// Save data to 'public/poems.json' so it acts as a static asset in production (Vercel)
const DATA_FILE = path.join(__dirname, 'public', 'poems.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const LEGACY_DATA_FILE = path.join(__dirname, 'poems.json'); // Check for old file to warn user

// --- Helper Functions ---

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Ensure data file exists inside public
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

const resetSettings = () => {
  const defaultSettings = {
    passwordHash: hashPassword('ink'), // Default password is 'ink'
    siteName: '墨韵诗集',
    siteEnName: 'Ink & Verse'
  };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf8');
    console.log('\n\x1b[36m%s\x1b[0m', '>>> 密码配置文件已重置 (Settings Reset) <<<');
    console.log('\x1b[36m%s\x1b[0m', '>>> 默认密码为: ink');
    console.log('\x1b[36m%s\x1b[0m', '>>> 请在登录后尽快修改密码。\n');
  } catch (err) {
    console.error("Critical Error: Could not write settings.json", err);
  }
};

// Check settings on startup
if (!fs.existsSync(SETTINGS_FILE)) {
  console.log("Settings file not found. Creating new one...");
  resetSettings();
} else {
  // Validate existing file
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    // Add missing fields if upgrading from old version
    if (!parsed.siteName) {
      parsed.siteName = '墨韵诗集';
      parsed.siteEnName = 'Ink & Verse';
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(parsed, null, 2), 'utf8');
    }
  } catch (e) {
    console.log("Settings file corrupted. Resetting...");
    resetSettings();
  }
}

// --- Auth APIs ---

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  // Always read fresh from disk to avoid stale memory state
  fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading settings during login:", err);
      // Try to recover
      resetSettings();
      return res.status(500).json({ error: 'Server error. Settings reset to default.' });
    }
    
    try {
      const settings = JSON.parse(data);
      const inputHash = hashPassword(password);
      
      console.log(`[Auth] Login attempt. Result: ${inputHash === settings.passwordHash ? 'Success' : 'Failed'}`);
      
      if (inputHash === settings.passwordHash) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: 'Incorrect password' });
      }
    } catch (e) {
      console.error("Settings file corrupted during login check. Resetting...");
      resetSettings();
      res.status(500).json({ error: 'Configuration error. Password reset to "ink". Please try again.' });
    }
  });
});

app.post('/api/password', (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Read error' });
    
    const settings = JSON.parse(data);
    settings.passwordHash = hashPassword(newPassword);

    fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), (err) => {
      if (err) {
        console.error("Write settings error:", err);
        return res.status(500).json({ error: 'Failed to save password' });
      }
      console.log(`[Auth] Password updated successfully at ${new Date().toLocaleTimeString()}`);
      res.json({ success: true });
    });
  });
});

// --- Settings/Config APIs ---

app.get('/api/config', (req, res) => {
  fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Read error' });
    try {
      const settings = JSON.parse(data);
      // Only return public config info
      res.json({
        siteName: settings.siteName || '墨韵诗集',
        siteEnName: settings.siteEnName || 'Ink & Verse'
      });
    } catch (e) {
      res.status(500).json({ error: 'Parse error' });
    }
  });
});

app.post('/api/config', (req, res) => {
  const { siteName, siteEnName } = req.body;
  
  fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Read error' });
    
    try {
      const settings = JSON.parse(data);
      if (siteName) settings.siteName = siteName;
      if (siteEnName) settings.siteEnName = siteEnName;

      fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Write error' });
        res.json({ success: true });
      });
    } catch(e) {
      res.status(500).json({ error: 'Parse error' });
    }
  });
});

// --- Content APIs ---

app.get('/api/poems', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      // If file doesn't exist or read error, return empty array but don't crash
      console.error("Read poems error (might be empty):", err.message);
      return res.json([]);
    }
    try {
      const json = JSON.parse(data || '[]');
      res.json(json);
    } catch (e) {
      res.json([]);
    }
  });
});

app.post('/api/poems', (req, res) => {
  const newPoem = req.body;
  if (!newPoem || !newPoem.id) {
    return res.status(400).json({ error: 'Invalid poem data' });
  }

  // Use absolute path for reliability
  const absPath = path.resolve(DATA_FILE);

  fs.readFile(absPath, 'utf8', (err, data) => {
    let poems = [];
    if (!err && data) {
      try { poems = JSON.parse(data); } catch (e) { poems = []; }
    }

    const index = poems.findIndex(p => p.id === newPoem.id);
    if (index >= 0) {
      poems[index] = newPoem;
    } else {
      poems.push(newPoem);
    }

    fs.writeFile(absPath, JSON.stringify(poems, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save data' });
      
      // Force update file timestamp so Windows/Git detects the change immediately
      const now = new Date();
      fs.utimes(absPath, now, now, (utimesErr) => {
        if (utimesErr) console.error("Warning: Could not update timestamp:", utimesErr);
        
        console.log(`[Content] Saved to: ${absPath}`);
        res.json({ success: true });
      });
    });
  });
});

app.delete('/api/poems/:id', (req, res) => {
  const { id } = req.params;
  const absPath = path.resolve(DATA_FILE);

  fs.readFile(absPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Read error' });
    let poems = [];
    try { poems = JSON.parse(data); } catch(e) {}

    const newPoems = poems.filter(p => p.id !== id);
    fs.writeFile(absPath, JSON.stringify(newPoems, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Write error' });
      
      // Force update timestamp
      const now = new Date();
      fs.utimes(absPath, now, now, () => {
         console.log(`[Content] Deleted poem: ${id}`);
         res.json({ success: true });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server "Butler" is running at http://localhost:${PORT}`);
  console.log(`- Active Data File: ${path.resolve(DATA_FILE)}`);
  
  // Warning for legacy file
  if (fs.existsSync(LEGACY_DATA_FILE)) {
    console.log('\n\x1b[33m%s\x1b[0m', '-------------------------------------------------------------');
    console.log('\x1b[33m%s\x1b[0m', '⚠️  注意：检测到根目录下存在旧的 "poems.json" 文件。');
    console.log('\x1b[33m%s\x1b[0m', '   当前系统读写的是 "public/poems.json" (为了适配 Vercel)。');
    console.log('\x1b[33m%s\x1b[0m', '   根目录下的旧文件已被忽略，不会更新。请查看 public 文件夹。');
    console.log('\x1b[33m%s\x1b[0m', '-------------------------------------------------------------\n');
  }
});
