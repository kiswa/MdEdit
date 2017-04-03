const {
    app,
    BrowserWindow,
    nativeImage
} = require('electron');
const path = require('path');
const url = require('url');

let mainWindow = null;
global.fileToOpen = '';

function createWindow() {
    mainWindow = new BrowserWindow({
        center: true,
        disableAutoHideCursor: true,
        frame: false,
        height: 750,
        icon: nativeImage.
            createFromPath(path.join(__dirname, 'assets/icon.png')),
        name: 'MdEdit',
        show: false,
        width: 1200,
        webPreferences: {
            devTools: true
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    })

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'src/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('open-file', (event, path) => {
  event.preventDefault();
  fileToOpen = path;

  if (mainWindow){
    mainWindow.send('open-file', path);
  }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

