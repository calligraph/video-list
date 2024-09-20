process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const { app, BrowserWindow, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const positionFilePath = path.join(app.getPath('userData'), 'window-position.json');
const remoteMain = require('@electron/remote/main'); // Ajouter cette ligne

remoteMain.initialize(); // Initialiser remote

let isDev = process.env.NODE_ENV === 'development'; // Détection de l'environnement

if (isDev) {
  require('electron-reload')(path.join(__dirname, 'src'), {
    electron: require(`${__dirname}/node_modules/electron`)
  });
}

let mainWindow = null
let moveTimeout = null

function saveWindowPosition() {
  if (mainWindow) {
    const position = mainWindow.getBounds();
    fs.writeFileSync(positionFilePath, JSON.stringify(position));
  }
}

function getWindowPosition() {
  try {
    const position = JSON.parse(fs.readFileSync(positionFilePath));
    return position;
  } catch (e) {
    // Si le fichier n'existe pas, retourne une position par défaut
    const cursorScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    return { x: cursorScreen.bounds.x + 100, y: cursorScreen.bounds.y + 100, width: 800, height: 600 };
  }
}

function followWindowPosition() {  
  if (moveTimeout) {
    clearTimeout(moveTimeout);  // Réinitialiser le timer à chaque mouvement
  }

  // Déclencher l'enregistrement après 500ms sans mouvement
  moveTimeout = setTimeout(() => {
    saveWindowPosition();
  }, 500);
}

function createWindow() {
  const position = getWindowPosition();
  
  mainWindow = new BrowserWindow({
    x: position.x,
    y: position.y,
    width: position.width,
    height: position.height,
    webPreferences: {
      nodeIntegration: true,  // Permet d'utiliser require dans renderer.js
      contextIsolation: false  // Désactive l'isolation de contexte (si nécessaire)
    }
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.on('close', saveWindowPosition);
  // Sauvegarde du mouvement
  mainWindow.on('move', followWindowPosition);
  remoteMain.enable(mainWindow.webContents); // Activer remote pour cette fenêtre
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  if (isDev) {
    mainWindow.webContents.openDevTools();
    // Raccourci pour ouvrir/fermer les DevTools (Ctrl+Shift+I)
    globalShortcut.register('F12', () => {
      console.log("open-close")
      mainWindow.webContents.isDevToolsOpened()
        ? mainWindow.webContents.closeDevTools()
        : mainWindow.webContents.openDevTools();
    });
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
