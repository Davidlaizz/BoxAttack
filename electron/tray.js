const { app, Tray, Menu, BrowserWindow } = require('electron');
const path = require('path');

let tray = null;

function createTray(mainWindow) {
  // 创建系统托盘
  tray = new Tray(path.join(__dirname, '../public/favicon.svg'));
  
  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: '最小化到托盘',
      click: () => {
        mainWindow.hide();
      }
    },
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  // 设置托盘提示
  tray.setToolTip('盒打击 - 系统监控工具');
  
  // 设置托盘菜单
  tray.setContextMenu(contextMenu);
  
  // 点击托盘显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
  
  return tray;
}

module.exports = { createTray };
