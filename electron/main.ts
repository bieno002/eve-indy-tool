import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { registerBlueprintHandlers } from './ipc/blueprints.js';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const devServerUrl = process.env['VITE_DEV_SERVER_URL'];
  if (devServerUrl) {
    void win.loadURL(devServerUrl);
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  registerBlueprintHandlers(ipcMain);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
