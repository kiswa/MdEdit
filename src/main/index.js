'use strict'

import { app, ipcMain, BrowserWindow } from 'electron'
import { join as pathJoin } from 'path'
import { format as formatUrl } from 'url'

const isDevelopment = process.env.NODE_ENV !== 'production'

let mainWindow = null
global.fileToOpen = ''

function createMainWindow () {
  const window = new BrowserWindow({
    center: true,
    frame: false,
    height: 750,
    title: 'MdEdit',
    show: false,
    width: 1200,
    minWidth: 640,
    minHeight: 480,
    webPreferences: {
      webSecurity: false
    }
  })

  if (isDevelopment) {
    window.webContents.openDevTools({ mode: 'detach' })
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  } else {
    window.loadURL(
      formatUrl({
        pathname: pathJoin(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
      })
    )
  }

  window.once('ready-to-show', () => {
    window.show()
    window.focus()
  })

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

ipcMain.on('get-file-data', event => {
  console.log(process.argv)
  event.returnValue = process.argv.length > 1 ? process.argv[1] : null
})

app.on('open-file', (event, path) => {
  event.preventDefault()
  global.fileToOpen = path

  if (mainWindow) {
    mainWindow.send('open-file', path)
  }
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

app.on('ready', () => {
  mainWindow = createMainWindow()
})
