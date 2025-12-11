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
    passwordHash: hashPassword('ink') // Default password is 'ink'
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf8');
  console.log(">> Settings file initialized/reset. Default password is 'ink'");
};

if (!fs.existsSync(SETTINGS_FILE)) {
  resetSettings();
}

// --- Auth APIs ---

app.post('/api/login', (req, res) => {
  console.log(`[Auth] Login attempt received at ${new Date().toLocaleTimeString()}`);
  
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Server error reading settings' });
    
    try {
      const settings = JSON.parse(data);
      const inputHash = hashPassword(password);
      
      if (inputHash === settings.passwordHash) {
        console.log(" > Login Success");
        res.json({ success: true });
      } else {
        console.log(" > Login Failed: Incorrect password");
        res.status(401).json({ error: 'Incorrect password' });
      }
    } catch (e) {
      console.error("Settings file corrupted. Resetting...");
      resetSettings();
      res.status(500).json({ error: 'Settings file was corrupted and has been reset. Please try login again with default password.' });
    }
  });
});

app.post('/api/password', (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const newHash = hashPassword(newPassword);
  const settings = { passwordHash: newHash };

  fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), (err) => {
    if (err) {
      console.error("Write settings error:", err);
      return res.status(500).json({ error: 'Failed to save password' });
    }
    console.log(`[Auth] Password updated successfully at ${new Date().toLocaleTimeString()}`);
    res.json({ success: true });
  });
});

// --- Content APIs ---

app.get('/api/poems', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error("Read error:", err);
      return res.status(500).json({ error: 'Failed to read data' });
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

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
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

    fs.writeFile(DATA_FILE, JSON.stringify(poems, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to save data' });
      
      // Force update file timestamp so Windows/Git detects the change immediately
      const now = new Date();
      fs.utimes(DATA_FILE, now, now, (utimesErr) => {
        if (utimesErr) console.error("Warning: Could not update timestamp:", utimesErr);
        
        console.log(`[Content] Saved to: ${path.resolve(DATA_FILE)}`);
        res.json({ success: true });
      });
    });
  });
});

app.delete('/api/poems/:id', (req, res) => {
  const { id } = req.params;
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Read error' });
    let poems = [];
    try { poems = JSON.parse(data); } catch(e) {}

    const newPoems = poems.filter(p => p.id !== id);
    fs.writeFile(DATA_FILE, JSON.stringify(newPoems, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Write error' });
      
      // Force update timestamp
      const now = new Date();
      fs.utimes(DATA_FILE, now, now, () => {
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