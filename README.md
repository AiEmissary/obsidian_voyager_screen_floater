# Obsidian Voyager screen floater

Source backup of the Windows Obsidian Voyager custom tool: a transparent, click-through Electron desktop overlay that displays a slowly flying GLB model across the desktop. Use its notification-area tray menu to close it.

## Contents

- `definition.json`, `index.js`, `ui.html`: custom-tool definition, start/stop/status integration and tool UI.
- `start_obsidian_voyager.ps1`: standalone Windows launcher.
- `desktop_host`: Electron main process, preload bridge and Three.js renderer.

These files are copied unchanged from the live custom-tool folder. The running overlay was not stopped or modified.

## Restore and run

This is source rather than a packaged installer. Install Electron in the repository root (`npm install --no-save electron`), then configure the launcher for your computer before running `start_obsidian_voyager.ps1`.

The current launcher contains development-PC paths for the tool directory, Electron and model. Update `$ToolDir` and `$ModelPath` in the PowerShell launcher. The custom-tool `index.js` also has a default model path and Electron search paths; supply `modelPath` or update those paths when restoring elsewhere.

The model is included at `assets/Meshy_AI_Obsidian_Voyager_0421201108_texture.glb`, copied and SHA-256 verified against the working Desktop model. Point `$ModelPath` in the launcher to this file when restoring. No separate model licence is supplied here.

The Electron host accepts `OBSIDIAN_VOYAGER_MODEL`, `OBSIDIAN_VOYAGER_TOOL_DIR`, `OBSIDIAN_VOYAGER_SPEED` and `OBSIDIAN_VOYAGER_SCALE`. The renderer currently loads Three.js 0.128.0 and GLTFLoader from jsDelivr, so it requires internet access.

## Verification and exclusions

All eight source files were hash-compared against the live folder. JavaScript entry points passed `node --check`. This backup operation did not launch another overlay or perform a fresh-machine installation test.

Runtime logs, process IDs, dependencies and caches are excluded. No unattended backup schedule is configured.
