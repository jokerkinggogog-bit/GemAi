const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("gem", {
  call: (route, body) => ipcRenderer.invoke("api", route, body),
  signIn: () => ipcRenderer.invoke("signin"),
  signOut: () => ipcRenderer.invoke("signout"),
  onAuth: (cb) => ipcRenderer.on("auth", () => cb())
});
