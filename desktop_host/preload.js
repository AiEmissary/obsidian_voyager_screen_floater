const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('voyagerHost', {
  getConfig: () => ipcRenderer.invoke('voyager:get-config'),
  readModel: () => ipcRenderer.invoke('voyager:read-model')
});
