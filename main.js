const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const cfg = require("./config.json");

let win;
const tokenFile = () => path.join(app.getPath("userData"), "session.json");
const getToken = () => { try { return JSON.parse(fs.readFileSync(tokenFile())).token; } catch { return null; } };
const setToken = (t) => {
  if (t) fs.writeFileSync(tokenFile(), JSON.stringify({ token: t }));
  else { try { fs.unlinkSync(tokenFile()); } catch {} }
};

// The website redirects to gemai://auth?token=... after Google sign-in.
function handleUrl(u) {
  try {
    const x = new URL(u);
    if (x.protocol === "gemai:" && x.hostname === "auth") {
      const t = x.searchParams.get("token");
      if (t) { setToken(t); if (win) win.webContents.send("auth"); }
    }
  } catch {}
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (_e, argv) => {
    const u = argv.find((a) => a.startsWith("gemai://"));
    if (u) handleUrl(u);
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.on("open-url", (e, u) => { e.preventDefault(); handleUrl(u); });
  app.setAsDefaultProtocolClient("gemai");
  app.whenReady().then(() => {
    win = new BrowserWindow({
      width: 1100, height: 760, backgroundColor: "#120f1c", title: "GemAI",
      webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false }
    });
    win.loadFile(path.join(__dirname, "renderer", "index.html"));
  });
  app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
}

ipcMain.handle("api", async (_e, route, body) => {
  if (!cfg.API_BASE) return { error: "not_configured" };
  try {
    const r = await fetch(cfg.API_BASE.replace(/\/$/, "") + "/" + route, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + (getToken() || "") },
      body: JSON.stringify(body || {})
    });
    return await r.json();
  } catch { return { error: "network" }; }
});
ipcMain.handle("signin", () => {
  if (!cfg.SITE_URL) return { error: "not_configured" };
  shell.openExternal(cfg.SITE_URL.replace(/\/$/, "") + "/app-login");
  return { ok: true };
});
ipcMain.handle("signout", () => { setToken(null); return { ok: true }; });
