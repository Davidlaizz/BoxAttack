const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createTray } = require('./tray.cjs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // 允许加载本地文件
    }
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  console.log('Loading index.html from:', indexPath);
  
  mainWindow.loadFile(indexPath)
    .then(() => {
      console.log('Successfully loaded index.html');
    })
    .catch((error) => {
      console.error('Failed to load index.html:', error);
    });
  
  // 开发模式下打开开发者工具
  mainWindow.webContents.openDevTools();
  
  // 监听渲染进程的错误
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription);
  });
  
  // 监听渲染进程的控制台消息
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Render process console:', message);
  });
  
  // 创建系统托盘
  createTray(mainWindow);
  
  // 窗口关闭时最小化到托盘
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 处理IPC通信
ipcMain.on('get-system-info', (event) => {
  // 在这里处理系统信息获取
  event.reply('system-info', { success: true, data: {} });
});
