const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
//const { initDatabase } = require("./db/database.cjs");

const isDev = !app.isPackaged;
let mainWindow = null;
let loginWindow = null;
let signupWindow = null;

//CREATE WINDOWS

function createSignupWindow() {
  signupWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../public/fidelogo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  signupWindow.loadURL("http://localhost:6969/signup");
  signupWindow.on("closed", () => {
    signupWindow = null;
  });
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../public/fidelogo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  loginWindow.loadURL("http://localhost:6969/login");
  loginWindow.on("closed", () => {
    loginWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../public/fidelogo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:6969/main");
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// LISTENERS

// OPEN LOGIN
ipcMain.on("signup-success", () => {
  if (signupWindow) signupWindow.close();
  createLoginWindow();
});

//OPEN DASHBOARD
ipcMain.on("login-success", () => {
  if (loginWindow) loginWindow.close();
  createMainWindow();
});

// GLOBAL LISTENER
ipcMain.on("message", (event, msg) => {
  console.log("Message received:", msg);
  event.sender.send("message-reply", `Message: ${msg}`);
});

// PRIVATE LISTENER
ipcMain.on("message_private", (event, msg) => {
  if (event.sender === mainWindow.webContents) {
    console.log("Message received:", msg);
    event.sender.send("message-private-reply", `Message: ${msg}`);
  } else {
    console.log("Not allowed");
    event.reply("message-private-reply", { error: "Not allowed" });
  }
});

//INITIALIZATION

app.whenReady().then(() => {
  //initDatabase();
  createSignupWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createSignupWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
