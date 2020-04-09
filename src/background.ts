import { app, ipcMain, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

app.allowRendererProcessReuse = true

const isDevelopment = process.env.NODE_ENV !== 'production'

let mainWindow: BrowserWindow | null
(global as any).fileToOpen = ''

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { secure: true, standard: true }
}])

function createWindow () {
  const win = new BrowserWindow({
    title: 'MdEdit',
    frame: false,
    show: false,
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  })

  const url = getUrl()
  win.loadURL(url)

  if (process.env.WEBPACK_DEV_SERVER_URL && !process.env.IS_TEST) {
    win.webContents.openDevTools()
  }

  win.once('ready-to-show', () => {
    win!.show()
    win!.focus()
  })

  win.on('closed', () => {
    mainWindow = null
  })

  return win
}

function getUrl() {
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    return process.env.WEBPACK_DEV_SERVER_URL
  } else {
    createProtocol('app')
    return 'app://./index.html'
  }

}

ipcMain.on('get-file-data', event => {
  event.returnValue = process.argv.length > 1
    ? process.argv[1]
    : null
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createWindow()
  }
})

app.on('ready', () => {
  mainWindow = createWindow()
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
