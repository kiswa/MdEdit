<template>
  <div id="app" :class="{ dark: isDarkTheme }"
    @keyup.ctrl.83="saveFile"
    @keyup.meta.83="saveFile"
    @keyup.ctrl.78="resetEditor"
    @keyup.meta.78="resetEditor"
    @keyup.ctrl.79="loadFile">

    <md-edit-header :isEditorView="isEditorView"
      :isPreviewView="isPreviewView"
      :isEdited="isEdited"
      :use-pro="useProIcons"
      :icons-loaded="iconsLoaded"
      :fileName="openFileName"
      @viewChanged="updateView"
      @closeApp="closeApp"
      @resetEditor="resetEditor"
      @loadFile="loadFile"
      @saveFile="saveFile"
      @toggleSettings="toggleSettings()" />

    <md-edit-settings v-if="showSettings"
      :use-pro="useProIcons"
      :icons-loaded="iconsLoaded"
      @closeSettings="showSettings = false"
      @settingsChanged="updateSettings" />

    <div class="container" :class="{ 'with-status': showStatus }">
      <div class="left"
        :class="{ 'full': isEditorView, 'shrunk': isPreviewView }">
        <md-edit-editor :markdown="markdown"
          :scrollPercent="editorScrollPercent"
          @markdownChanged="updateMarkdown"
          @scrolled="editorScrolled" />
      </div>

      <div class="right" id="preview"
        :class="{ 'full': isPreviewView, 'shrunk': isEditorView }"
        @scroll="updatePreviewScroll">
        <md-edit-preview :markdown="markdown"
          :filePath="openFilePath"
          :scrollPercent="previewScrollPercent" />
      </div>
    </div>

    <div class="container is-status">
      <md-edit-status v-if="showStatus"
        :isEdited="isEdited"
        :filename="openFile" />
    </div>

    <div id="notification" v-if="showNote" @click="showNote = false">
      <div>Saved file {{ openFile }}</div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { remote, ipcRenderer } from 'electron'
import fs from 'fs'

import MdEditHeader from './components/MdEditHeader.vue'
import MdEditEditor from './components/MdEditEditor.vue'
import MdEditPreview from './components/MdEditPreview.vue'
import MdEditSettings from './components/MdEditSettings.vue'
import MdEditStatus from './components/MdEditStatus.vue'

Vue.component('font-awesome-icon', FontAwesomeIcon)
export default {
  name: 'app',

  components: {
    MdEditHeader,
    MdEditEditor,
    MdEditPreview,
    MdEditSettings,
    MdEditStatus
  },

  data () {
    return {
      markdown: '',
      openFile: '',
      openFileName: '',
      openFilePath: '',

      useProIcons: false,
      iconsLoaded: false,
      isEditorView: false,
      isPreviewView: false,

      isUpdatingScroll: false,
      isEdited: false,
      isDarkTheme: false,
      rememberLayout: false,

      showSettings: false,
      showStatus: false,
      showNote: false,

      editorScrollPercent: 0,
      previewScrollPercent: 0
    }
  },

  mounted () {
    this.loadIcons()
    this.updateSettings()

    if (this.rememberLayout) {
      this.isEditorView = JSON.parse(localStorage.getItem('isEditorView'))
      this.isPreviewView = JSON.parse(localStorage.getItem('isPreviewView'))
    }

    const fileToOpen = ipcRenderer.sendSync('get-file-data')
    if (fileToOpen && fileToOpen.length && this.openFileFromPath(fileToOpen)) {
      return
    }

    if (this.loadPrevious) {
      const path = localStorage.getItem('lastFile')
      this.openFileFromPath(path)
    }
  },

  methods: {
    focusEditor () {
      setTimeout(() => {
        const editor = document.getElementById('editor')

        editor.focus()
        editor.setSelectionRange(0, 0)
        editor.scrollTop = 0
      }, 250)
    },

    closeApp () {
      this.checkUnsaved(() => {
        remote.getCurrentWindow().close()
      })
    },

    loadIcons () {
      let faSave, faFile, faFilePlus, faFolderOpen, faCog,
        faAngleLeft, faAngleRight, faTimes

      /* eslint-disable */
      import('@fortawesome/pro-light-svg-icons')
        .then(pro => {
          faSave = pro.faSave
          faFilePlus = pro.faFilePlus
          faFolderOpen = pro.faFolderOpen
          faCog = pro.faCog
          faAngleLeft = pro.faAngleLeft
          faAngleRight = pro.faAngleRight
          faTimes = pro.faTimes

          library.add(faSave, faFilePlus, faFolderOpen, faCog,
            faAngleRight, faAngleLeft, faTimes)
          this.useProIcons = true
          this.iconsLoaded = true
        }, err => {
          import('@fortawesome/free-solid-svg-icons')
            .then(free => {
              faSave = free.faSave
              faFile = free.faFile
              faFolderOpen = free.faFolderOpen
              faCog = free.faCog
              faAngleLeft = free.faAngleLeft
              faAngleRight = free.faAngleRight
              faTimes = free.faTimes

              library.add(faSave, faFile, faFolderOpen, faCog,
                faAngleRight, faAngleLeft, faTimes)
              this.useProIcons = false
              this.iconsLoaded = true
            })
        })
      /* eslint-enable */
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

    openFileFromPath (path) {
      try {
        const sep = process.platform === 'win32' ? '\\' : '/'
        const parts = path.split(sep)
        const contents = fs.readFileSync(path)

        localStorage.setItem('lastFile', path)
        remote.app.addRecentDocument(path)

        this.markdown = contents.toString()
        this.isEdited = false
        this.openFile = path
        this.openFileName = parts[parts.length - 1]

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
      }, filename => {
        if (!filename) {
          return
        }

        fs.writeFileSync(filename, this.markdown)

        this.openFile = filename
        this.isEdited = false
        this.notifySaved()
      })
    },

    updateSettings () {
      const settings = localStorage.getItem('settings')
        ? JSON.parse(localStorage.getItem('settings'))
        : {}

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
        this.openFileName = ''
      })
    },

    updateMarkdown (text, isEdit = true) {
      this.markdown = text
      this.isEdited = isEdit
    },

    updateView (values) {
      this.isEditorView = values.isEditorView
      this.isPreviewView = values.isPreviewView

      localStorage.setItem('isEditorView', this.isEditorView)
      localStorage.setItem('isPreviewView', this.isPreviewView)
    },

    updatePreviewScroll (event) {
      if (this.isUpdatingScroll) {
        this.isUpdatingScroll = false
        return
      }

      const preview = document.getElementById('preview')
      const scrollTop = preview.scrollTop
      const height = preview.scrollHeight
      const clientHeight = preview.clientHeight

      this.isUpdatingScroll = true
      this.editorScrollPercent = scrollTop / (height - clientHeight)
    },

    editorScrolled (percent) {
      if (this.isUpdatingScroll) {
        this.isUpdatingScroll = false
        return
      }

      this.isUpdatingScroll = true
      this.previewScrollPercent = percent
    },

    checkUnsaved (fn) {
      if (!this.isEdited) {
        fn()
        return
      }

      remote.dialog.showMessageBox({
        cancelId: 1,
        type: 'question',
        message: 'You have unsaved changes, discard and continue?',
        buttons: ['OK', 'Cancel']
      }, (buttonId) => {
        if (buttonId === 0) {
          fn()
        }
      })
    },

    notifySaved () {
      this.showNote = true

      const hideNote = () => {
        this.showNote = false
      }

      setTimeout(hideNote.bind(this), 2000)
    }
  }
}
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

.dark {
  ::-webkit-scrollbar-track {
    background-color: rgb(30, 30, 30);
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgb(45, 45, 45);
  }
}

::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, .1);
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
  left: calc(50% - 150px);
  padding: .5em;
  position: absolute;
  top: 45px;
  width: 300px;
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
