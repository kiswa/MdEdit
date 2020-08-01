<template>
  <div
    id="app"
    :class="{ dark: isDarkTheme }"
    @keyup.ctrl.83="saveFile"
    @keyup.meta.83="saveFile"
    @keyup.ctrl.78="resetEditor"
    @keyup.meta.78="resetEditor"
    @keyup.ctrl.79="loadFile"
  >
    <top-bar
      :icons-loaded="iconsLoaded"
      :filename="openFilename"
      :is-editor-view="isEditorView"
      :is-preview-view="isPreviewView"
      :is-edited="isEdited"
      @resetEditor="resetEditor"
      @loadFile="loadFile"
      @saveFile="saveFile"
      @viewChanged="updateView"
      @closeApp="closeApp"
      @toggleSettings="toggleSettings"
    />

    <settings
      v-if="showSettings"
      :icons-loaded="iconsLoaded"
      @closeSettings="showSettings = false"
      @settingsChanged="updateSettings"
    />

    <div
      class="container"
      :class="{ 'with-status': showStatus }"
    >
      <div
        class="left"
        :class="{ 'full': isEditorView, 'shrunk': isPreviewView }"
      >
        <editor
          :markdown="markdown"
          :scroll-percent="editorScrollPercent"
          @markdownChanged="updateMarkdown"
          @scrolled="editorScrolled"
        />
      </div>

      <div
        id="preview"
        class="right"
        :class="{ 'full': isPreviewView, 'shrunk': isEditorView }"
        @scroll="updatePreviewScroll"
      >
        <preview
          :markdown="markdown"
          :file-path="openFilePath"
          :scroll-percent="previewScrollPercent"
        />
      </div>
    </div>

    <div class="container is-status">
      <status-bar
        v-if="showStatus"
        :is-edited="isEdited"
        :filename="openFile"
      />
    </div>

    <div
      v-if="showNote"
      id="notification"
      @click="showNote = false"
    >
      <div>Saved file {{ openFile }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { remote, ipcRenderer } from 'electron'
import fs from 'fs'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import Editor from './components/Editor.vue'
import Preview from './components/Preview.vue'
import StatusBar from './components/StatusBar.vue'
import Settings from './components/Settings.vue'
import TopBar from './components/TopBar.vue'

Vue.component('font-awesome-icon', FontAwesomeIcon)

interface ViewChanges {
  isEditorView: boolean;
  isPreviewView: boolean;
}

interface WindowData {
  x: number | undefined;
  y: number | undefined;
  height: number | undefined;
  width: number | undefined;
  isMaximized: boolean | undefined;
}

export default Vue.extend({
  name: 'App',

  components: {
    Editor,
    Preview,
    Settings,
    StatusBar,
    TopBar
  },

  data () {
    return {
      openFilename: '',
      openFilePath: '',
      openFile: '',
      markdown: '',

      iconsLoaded: false,
      isEditorView: false,
      isPreviewView: false,

      isUpdatingScroll: false,
      isEdited: false,
      isDarkTheme: false,
      rememberLayout: false,
      loadPrevious: false,

      showSettings: false,
      showStatus: false,
      showNote: false,

      editorScrollPercent: 0,
      previewScrollPercent: 0
    }
  },

  created () {
    const newInfo: WindowData = {
      height: 600,
      width: 800,
      x: undefined,
      y: undefined,
      isMaximized: false
    }

    const getInfo = () => {
      let infoStr = localStorage.getItem('windowInfo')

      if (infoStr === null) {
        infoStr = JSON.stringify(newInfo)
      }

      return JSON.parse(infoStr)
    }

    const windowInfo = getInfo()

    if (windowInfo === newInfo) {
      localStorage.setItem('windowInfo', JSON.stringify(newInfo))
    }

    const info = getInfo()
    const win = remote.getCurrentWindow()

    win.setSize(info.width, info.height)

    if (info.x && info.y) {
      win.setPosition(info.x, info.y)
    }

    if (info.isMaximized) {
      remote.getCurrentWindow().maximize()
    }

    const handler = (evt: any) => {
      const info = getInfo()
      Object.assign(info, evt.sender.getBounds())
      localStorage.setItem('windowInfo', JSON.stringify(info))
      localStorage.setItem('windowInfo', JSON.stringify(info))
    }

    win.on('move', handler)
    win.on('resize', handler)
    win.on('maximize', () => {
      const info = getInfo()
      info.isMaximized = true
      localStorage.setItem('windowInfo', JSON.stringify(info))
    })
  },

  mounted () {
    this.loadIcons()
    this.updateSettings()

    const file = remote.getGlobal('fileToOpen')

    if (file.length) {
      this.openFilename = file
    }

    if (this.rememberLayout) {
      const isEd = localStorage.getItem('isEditorView')
      const isPre = localStorage.getItem('isPreviewView')

      this.isEditorView = isEd ? JSON.parse(isEd) : false
      this.isPreviewView = isPre ? JSON.parse(isPre) : false
    }

    const fileToOpen = ipcRenderer.sendSync('get-file-data')
    if (fileToOpen && fileToOpen.length && this.openFileFromPath(fileToOpen)) {
      return
    }

    if (this.loadPrevious) {
      const path = localStorage.getItem('lastFile') || ''
      this.openFileFromPath(path)
    }

    this.focusEditor()
  },

  methods: {
    focusEditor () {
      setTimeout(() => {
        const editor = document.getElementById('editor') as HTMLInputElement

        editor.focus()
        editor.setSelectionRange(0, 0)
        editor.scrollTop = 0
      }, 250)
    },

    updateView (values: ViewChanges) {
      this.isEditorView = values.isEditorView
      this.isPreviewView = values.isPreviewView

      localStorage.setItem('isEditorView', this.isEditorView.toString())
      localStorage.setItem('isPreviewView', this.isPreviewView.toString())
    },

    closeApp () {
      this.checkUnsaved(() => remote.getCurrentWindow().close())
    },

    loadFile () {
      this.checkUnsaved(() => {
        remote.dialog.showOpenDialog({
          title: 'Select a file to edit',
          filters: [
            { name: 'Markdown Documents', extensions: ['md', 'markdown'] }
          ],
          properties: ['openFile']
        }).then(result => {
          if (result.canceled) {
            return
          }

          const path = result.filePaths[0]
          if (!path || !path.length) {
            return
          }

          this.openFileFromPath(path)
        })
      })
    },

    openFileFromPath (path: string) {
      try {
        const sep = process.platform === 'win32' ? '\\' : '/'
        const parts = path.split(sep)
        const contents = fs.readFileSync(path)

        localStorage.setItem('lastFile', path)
        remote.app.addRecentDocument(path)

        this.markdown = contents.toString()
        this.isEdited = false
        this.openFile = path
        this.openFilename = parts[parts.length - 1]

        parts.splice(-1)
        this.openFilePath = parts.join(sep) + sep

        this.focusEditor()
      } catch (e) {
        return false
      }

      return true
    },

    saveFile () {
      if (this.openFile !== '') {
        fs.writeFileSync(this.openFile, this.markdown)
        this.isEdited = false
        this.notifySaved()
        return
      }

      remote.dialog.showSaveDialog({
        title: 'Save Markdown File',
        filters: [{ name: 'Markdown Documents', extensions: ['md', 'markdown'] }]
      }).then(result => {
        if (!result.filePath) {
          return
        }

        fs.writeFileSync(result.filePath, this.markdown)

        this.openFile = result.filePath
        this.isEdited = false
        this.notifySaved()
      })
    },

    checkUnsaved (fn: Function) {
      if (!this.isEdited) {
        fn()
        return
      }

      remote.dialog.showMessageBox({
        cancelId: 1,
        type: 'question',
        message: 'You have unsaved changes, discard and continue?',
        buttons: ['OK', 'Cancel']
      }).then(buttonId => {
        if (buttonId.response === 0) {
          fn()
        }
      })
    },

    loadIcons () {
      import('@fortawesome/pro-light-svg-icons')
        .then(pro => {
          const faSave = pro.faSave
          const faFilePlus = pro.faFilePlus
          const faFolderOpen = pro.faFolderOpen
          const faCog = pro.faCog
          const faAngleLeft = pro.faAngleLeft
          const faAngleRight = pro.faAngleRight
          const faTimes = pro.faTimes

          library.add(faSave, faFilePlus, faFolderOpen, faCog,
            faAngleRight, faAngleLeft, faTimes)
          this.iconsLoaded = true
        })
    },

    updateSettings () {
      const settingsString = localStorage.getItem('settings')
      const settings = settingsString === null
        ? {}
        : JSON.parse(settingsString)

      this.isDarkTheme = settings.theme ? settings.theme === 'dark' : false
      this.showStatus = settings.showStatus ? settings.showStatus : false
      this.rememberLayout = settings.layout ? settings.layout : false
      this.loadPrevious = settings.reopen ? settings.reopen : false
    },

    toggleSettings () {
      this.showSettings = !this.showSettings
    },

    resetEditor () {
      this.checkUnsaved(() => {
        this.updateMarkdown('', false)
        this.openFile = ''
        this.openFilename = ''
      })
    },

    updateMarkdown (text: string, isEdit = true) {
      this.markdown = text
      this.isEdited = isEdit
    },

    updatePreviewScroll () {
      if (this.isUpdatingScroll) {
        this.isUpdatingScroll = false
        return
      }

      const preview = document.getElementById('preview') as HTMLDivElement
      const scrollTop = preview.scrollTop
      const height = preview.scrollHeight
      const clientHeight = preview.clientHeight

      this.isUpdatingScroll = true
      this.editorScrollPercent = scrollTop / (height - clientHeight)
    },

    editorScrolled (percent: number) {
      if (this.isUpdatingScroll) {
        this.isUpdatingScroll = false
        return
      }

      this.isUpdatingScroll = true
      this.previewScrollPercent = percent
    },

    notifySaved () {
      this.showNote = true

      const hideNote = () => {
        this.showNote = false
      }

      setTimeout(hideNote.bind(this), 3000)
    }
  }
})
</script>

<style lang="scss">
@import '../node_modules/normalize.css/normalize.css';
@import 'assets/fonts/fonts.css';

html {
  box-sizing: border-box;
  font-family: 'Source Sans Pro';
}

*, *:before, *:after {
  box-sizing: inherit;
}

::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

::-webkit-scrollbar-button {
  display: none;
}

::-webkit-scrollbar-track {
  background-color: rgb(230, 230, 230);
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, .1);
}

.dark {
  ::-webkit-scrollbar-track {
    background-color: rgb(30, 30, 30);
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgb(45, 45, 45);
  }
}

body {
  background-color: #fefefe;
  color: #585858;
  height: 100vh;
  overflow: hidden;

  .dark {
    background-color: #303030;
    color: #ccc;

    select {
      background-color: #585858 !important;
      background-image: url('assets/dropdown-arrow.png'),
      linear-gradient(#585858, #585858) !important;
    }

    .container {
      .left {
        textarea {
          background-color: #353535;
          color: #ccc;
        }
      }
    }
  }
}

#app {
  height: 100%;
}

#notification {
  align-items: center;
  background-color: rgba(96, 75, 127, .85);
  border: 1px solid #444;
  border-radius: 3px;
  box-shadow: 0 5px 10px 0 rgba(0, 0, 0, .15),
  0 4px 14px 0 rgba(0, 0, 0, .12);
  color: #fefefe;
  cursor: pointer;
  display: flex;
  height: 3.5rem;
  justify-content: center;
  left: calc(50% - 300px);
  padding: .5em;
  position: absolute;
  top: 45px;
  width: 600px;
}

.dark {
  #notification {
    border: 1px solid #999;
  }
}

.container {
  display: flex;
  height: calc(100% - 38px);
  z-index: 1;

  &.with-status {
    height: calc(100% - (38px + 28px));
  }

  &.is-status {
    height: 28px;
  }

  .left,
  .right {
    flex: 1 50%;
  }

  .left {
    background-color: #efefef;
    border-right: 1px solid #aaa;
    font-family: 'Source Code Pro';
    font-size: .9em;

    &.full {
      border: 0;
    }

    &.shrunk {
      display: none;
    }
  }

  .right {
    overflow-y: scroll;

    &.shrunk {
      display: none;
    }
  }
}
</style>
