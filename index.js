const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TOOL_DIR = __dirname;
const HOST_DIR = path.join(TOOL_DIR, 'desktop_host');
const PID_FILE = path.join(TOOL_DIR, 'obsidian_voyager.pid.json');
const DEFAULT_MODEL = 'C:\\Users\\rajka\\Desktop\\Meshy_AI_Obsidian_Voyager_0421201108_texture.glb';

function json(value) {
  return { type: 'application/json', content: JSON.stringify(value, null, 2) };
}

function isRunning(pid) {
  if (!pid) return false;
  try { process.kill(Number(pid), 0); return true; } catch { return false; }
}

function readPid() {
  try { return JSON.parse(fs.readFileSync(PID_FILE, 'utf8')); } catch { return null; }
}

function writePid(info) {
  fs.writeFileSync(PID_FILE, JSON.stringify(info, null, 2));
}

function removePid() {
  try { fs.unlinkSync(PID_FILE); } catch {}
}

function findElectronExe() {
  const candidates = [
    path.join(TOOL_DIR, 'node_modules', 'electron', 'dist', 'electron.exe'),
    'C:\\Users\\rajka\\AppData\\Roaming\\graviton\\custom-tools\\Studio3\\node_modules\\electron\\dist\\electron.exe',
    'C:\\Users\\rajka\\AppData\\Roaming\\npm\\node_modules\\electron\\dist\\electron.exe',
    'C:\\Program Files\\nodejs\\node_modules\\electron\\dist\\electron.exe'
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function status() {
  const info = readPid();
  const running = !!(info && isRunning(info.pid));
  if (info && !running) removePid();
  return { success: true, running, pid: running ? info.pid : null, info: running ? info : null };
}

function start(args = {}) {
  const current = status();
  if (current.running) return { success: true, alreadyRunning: true, ...current };

  const modelPath = args.modelPath || DEFAULT_MODEL;
  if (!fs.existsSync(modelPath)) {
    return { success: false, error: `GLB model not found: ${modelPath}` };
  }

  const electronExe = findElectronExe();
  if (!electronExe) {
    return {
      success: false,
      error: 'Could not find electron.exe. Install Electron in this tool folder or keep Studio3/node_modules/electron available.',
      lookedIn: ['obsidian_voyager/node_modules/electron', 'Studio3/node_modules/electron']
    };
  }

  const env = {
    ...process.env,
    OBSIDIAN_VOYAGER_MODEL: modelPath,
    OBSIDIAN_VOYAGER_SPEED: String(args.speed || 1),
    OBSIDIAN_VOYAGER_SCALE: String(args.scale || 2),
    OBSIDIAN_VOYAGER_TOOL_DIR: TOOL_DIR
  };

  const child = spawn(electronExe, [HOST_DIR], {
    cwd: HOST_DIR,
    env,
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  child.unref();

  const info = { pid: child.pid, started: new Date().toISOString(), modelPath, electronExe, speed: Number(args.speed || 1), scale: Number(args.scale || 2) };
  writePid(info);
  return { success: true, running: true, pid: child.pid, message: 'Obsidian Voyager launched. Right-click its tray/notification-area icon and choose Close Voyager to stop it.', info };
}

function stop() {
  const info = readPid();
  if (!info || !info.pid) return { success: true, running: false, message: 'No saved Voyager process was running.' };
  if (!isRunning(info.pid)) { removePid(); return { success: true, running: false, message: 'Saved Voyager process had already stopped.' }; }
  try {
    process.kill(Number(info.pid));
    removePid();
    return { success: true, running: false, message: `Stopped Obsidian Voyager process ${info.pid}.` };
  } catch (error) {
    return { success: false, error: error.message || String(error), pid: info.pid };
  }
}

async function execute(args = {}) {
  const mode = args.mode || 'headless';
  if (mode === 'ui') {
    const html = fs.readFileSync(path.join(TOOL_DIR, 'ui.html'), 'utf8')
      .replace('{{CONFIG}}', JSON.stringify({ toolDir: TOOL_DIR, defaultModel: DEFAULT_MODEL }));
    return { type: 'text/html', content: html };
  }

  const action = args.action || 'start';
  if (action === 'start') return json(start(args));
  if (action === 'stop') return json(stop());
  if (action === 'status') return json(status());
  if (action === 'info') return json({ success: true, name: 'obsidian_voyager', defaultModel: DEFAULT_MODEL, actions: ['start', 'stop', 'status', 'info'], close: 'Right-click the Obsidian Voyager tray/notification-area icon and choose Close Voyager.' });
  return json({ success: false, error: `Unknown action: ${action}` });
}

module.exports = { execute };
