const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => {
    return new Promise((resolve) => {
      ipcRenderer.once('system-info', (event, result) => {
        resolve(result);
      });
      ipcRenderer.send('get-system-info');
    });
  }
});
