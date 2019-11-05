"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var win, serve;
var args = process.argv.slice(1);
serve = args.some(function (val) { return val === '--serve'; });
function createWindow() {
    var size = electron_1.screen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    if (serve) {
        win = new electron_1.BrowserWindow({
            x: 10,
            y: 10,
            width: size.width - 300,
            height: size.height - 100,
            webPreferences: {
                nodeIntegration: true,
            }
        });
        require('electron-reload')(__dirname, {
            electron: require(__dirname + "/node_modules/electron")
        });
        win.loadURL('http://localhost:4200');
    }
    else {
        win = new electron_1.BrowserWindow({
            x: 10,
            y: 10,
            width: size.width - 20,
            height: size.height - 20,
            webPreferences: {
                nodeIntegration: true,
            },
            frame: false
        });
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/endpoint/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
    if (serve) {
        win.webContents.openDevTools();
    }
    // Emitted when the window is closed.
    win.on('closed', function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
}
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    electron_1.app.on('ready', createWindow);
    // Quit when all windows are closed.
    electron_1.app.on('window-all-closed', function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    electron_1.app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
    electron_1.app.on('certificate-error', function (event, webContents, urlStr, error, certificate, callback) {
        // On certificate error we disable default behaviour (stop loading the page)
        // and we then say "it is all fine - true" to the callback
        event.preventDefault();
        callback(true);
    });
}
catch (e) {
    // Catch Error
}
//# sourceMappingURL=main.js.map