const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { PARAMS, VALUE,  MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('mica-electron');
const os = require('os');
const path = require('path');
const fs = require('fs');

// 引入自定义electron titlebar
const { setupTitlebar, attachTitlebarToWindow, TitlebarColor } = require("custom-electron-titlebar/main");

setupTitlebar();

function createWindow() {
  const isWindows = os.platform() === 'win32';

  const win = new MicaBrowserWindow({
    
    show: false,
    minWidth: 660,
    minHeight: 400,
    titleBarStyle: isWindows ? 'hidden' : 'hiddenInset',
    /*titleBarOverlay: true,*/
    /*maximizable: true,*/
    autoHideMenuBar: isWindows,
    vibrancy: 'sidebar',
    trafficLightPosition: { x: 18, y: 18 },
    /*backgroundMaterial: 'mica',*/
    /*backgroundMaterial: 'acrylic',*/
    /*frame: true,*/
    webPreferences: {
      sandbox: false,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.js'), // 假定您有一个preload.js文件
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    }
  
  });

  win.setMicaEffect();

  // 在此处省略win.webContents.on('did-finish-load')及之后的代码...

  win.webContents.on('did-finish-load', () => {
    const cssFile = isWindows ? 'windows.css' : 'macos.css';
    const cssPath = path.join(__dirname, cssFile);

    // 检查CSS文件是否存在
    if (fs.existsSync(cssPath)) {
      fs.readFile(cssPath, 'utf8', (err, css) => {
        if (err) {
          console.error(`Failed to read ${cssFile}:`, err);
        } else {
          win.webContents.insertCSS(css).catch(console.error);
        }
      });
    } else {
      console.error(`${cssFile} not found.`);
    }

    // 假设inject.js逻辑不依赖于CSS注入成功
    const jsPath = path.join(__dirname, 'inject.js');
    fs.readFile(jsPath, 'utf8', (err, js) => {
      if (err) {
        console.error(`Failed to read inject.js:`, err);
      } else {
        win.webContents.executeJavaScript(js).catch(console.error);
      }
    });
  });

  win.loadURL('https://www.notion.so').catch(console.error);

  win.once('ready-to-show', () => {
    win.show();
  });

  // Intercept new-window events and open URLs in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.includes('notion.so')) {
      shell.openExternal(url).catch(console.error);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Intercept all navigation events
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.includes('notion.so')) {
      event.preventDefault();
      shell.openExternal(url).catch(console.error);
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});