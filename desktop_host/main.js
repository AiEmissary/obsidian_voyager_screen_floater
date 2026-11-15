const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const TOOL_DIR = process.env.OBSIDIAN_VOYAGER_TOOL_DIR || path.resolve(__dirname, '..');
const MODEL_PATH = process.env.OBSIDIAN_VOYAGER_MODEL || 'C:\\Users\\rajka\\Desktop\\Meshy_AI_Obsidian_Voyager_0421201108_texture.glb';
const SPEED = Number(process.env.OBSIDIAN_VOYAGER_SPEED || 1);
const SCALE = Number(process.env.OBSIDIAN_VOYAGER_SCALE || 1);
const PID_FILE = path.join(TOOL_DIR, 'obsidian_voyager.pid.json');
const LOG_FILE = path.join(TOOL_DIR, 'obsidian_voyager.log');

let win = null;
let tray = null;
let quitting = false;

function log(message) {
  try { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`); } catch {}
}

function cleanupPid() {
  try { fs.unlinkSync(PID_FILE); } catch {}
}

function makeTrayIcon() {
  const size = 16;
  const canvas = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">' +
    '<rect width="16" height="16" rx="4" fill="#090915"/>' +
    '<path d="M2 9 L13.5 3.5 L10 8 L13.5 12.5 Z" fill="#b8f3ff" stroke="#ffffff" stroke-width=".6"/>' +
    '<circle cx="5" cy="8.8" r="1.2" fill="#8b5cf6"/>' +
    '</svg>'
  );
  return nativeImage.createFromBuffer(canvas);
}

function createWindow() {
  const displays = screen.getAllDisplays();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of displays) {
    minX = Math.min(minX, d.bounds.x);
    minY = Math.min(minY, d.bounds.y);
    maxX = Math.max(maxX, d.bounds.x + d.bounds.width);
    maxY = Math.max(maxY, d.bounds.y + d.bounds.height);
  }
  const width = maxX - minX;
  const height = maxY - minY;

  win = new BrowserWindow({
    x: minX,
    y: minY,
    width,
    height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    alwaysOnTop: true,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.setIgnoreMouseEvents(true, { forward: true });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'voyager.html'));
  win.once('ready-to-show', () => win && win.showInactive());
  win.on('closed', () => { win = null; });
}

function createTray() {
  tray = new Tray(makeTrayIcon());
  tray.setToolTip('Obsidian Voyager - right-click to close');
  const menu = Menu.buildFromTemplate([
    { label: 'Obsidian Voyager is flying', enabled: false },
    { type: 'separator' },
    { label: 'Close Voyager', click: () => { quitting = true; app.quit(); } }
  ]);
  tray.setContextMenu(menu);
  tray.on('double-click', () => { quitting = true; app.quit(); });
}

ipcMain.handle('voyager:get-config', async () => ({
  modelPath: MODEL_PATH,
  speed: SPEED,
  scale: SCALE,
  bounds: win ? win.getBounds() : null
}));

ipcMain.handle('voyager:read-model', async () => {
  try {
    return { success: true, base64: fs.readFileSync(MODEL_PATH).toString('base64') };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
});

app.whenReady().then(() => {
  log(`Starting Voyager with model ${MODEL_PATH}`);
  createTray();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}).catch((error) => {
  log(`Startup error: ${error && (error.stack || error.message) || error}`);
  app.quit();
});

app.on('before-quit', () => { quitting = true; cleanupPid(); });
app.on('window-all-closed', () => { if (quitting) app.quit(); });
