import { app, ipcMain, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

const isDevelopment = process.env.NODE_ENV !== 'production'

let mainWindow: BrowserWindow | null
(global as any).fileToOpen = ''

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { secure: true, standard: true }
}])

function createMainWindow () {
  const win = new BrowserWindow({
    center: true,
    frame: false,
    height: 750,
    minHeight: 480,
    minWidth: 640,
    show: false,
    title: 'MdEdit',
    width: 1200,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools()
    }
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
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

ipcMain.on('get-file-data', event => {
  console.log(event)
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
    mainWindow = createMainWindow()
  }
})

app.on('ready', async () => {
  mainWindow = createMainWindow()
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
