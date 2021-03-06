<template>
  <nav v-if="iconsLoaded">
    <div class="left">
      <img
        src="../assets/icon.png"
        height="32px"
        alt="MdEdit"
        title="MdEdit"
      >

      <div
        class="icon"
        title="New File"
        @click="newFile"
      >
        <font-awesome-icon :icon="['fal', 'file-plus']" />
      </div>

      <div
        class="icon"
        title="Open File"
        @click="openFile"
      >
        <font-awesome-icon :icon="['fal', 'folder-open']" />
      </div>

      <div
        class="icon"
        :title="'Save ' + fileName"
        @click="saveFile"
      >
        <font-awesome-icon :icon="['fal', 'save']" />
      </div>

      <div
        class="icon"
        title="Settings"
        @click="toggleSettings"
      >
        <font-awesome-icon :icon="['fal', 'cog']" />
      </div>

      <div
        class="icon auto-right"
        title="Expand Editor"
        @click="expandEditor"
      >
        <font-awesome-icon :icon="['fal', 'angle-right']" />
      </div>
    </div>

    <div class="right">
      <div
        class="icon auto-left"
        title="Expand Preview"
        @click="expandPreview"
      >
        <font-awesome-icon :icon="['fal', 'angle-left']" />
      </div>

      <div
        class="icon close"
        title="Close"
        @click="closeApp"
      >
        <font-awesome-icon :icon="['fal', 'times']" />
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'TopBar',

  props: {
    isEditorView: {
      type: Boolean,
      default: false
    },

    isPreviewView: {
      type: Boolean,
      default: false
    },

    isEdited: {
      type: Boolean,
      default: false
    },

    iconsLoaded: {
      type: Boolean,
      default: false
    },

    filename: {
      type: String,
      default: 'File'
    }
  },

  data () {
    return {
      fileName: 'File'
    }
  },

  watch: {
    filename () {
      this.fileName = this.filename
    }
  },

  methods: {
    newFile () {
      this.$emit('newFile')
    },

    openFile () {
      this.$emit('loadFile')
    },

    saveFile () {
      this.$emit('saveFile')
    },

    toggleSettings () {
      this.$emit('toggleSettings')
    },

    expandEditor () {
      if (this.isEditorView) {
        return
      }

      if (this.isPreviewView) {
        this.notifyChanges()
        return
      }

      this.notifyChanges(true, false)
    },

    expandPreview () {
      if (this.isPreviewView) {
        return
      }

      if (this.isEditorView) {
        this.notifyChanges()
        return
      }

      this.notifyChanges(false, true)
    },

    closeApp () {
      this.$emit('closeApp')
    },

    notifyChanges (isEditorView = false, isPreviewView = false) {
      this.$emit('viewChanged', { isEditorView, isPreviewView })
    }
  }
})
</script>

<style lang="scss" scoped>
nav {
  -webkit-app-region: drag;
  align-items: center;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14),
              0 1px 5px 0 rgba(0, 0, 0, .12),
              0 3px 1px -2px rgba(0, 0, 0, .2);
  display: flex;
  font-size: 1.3rem;
  height: 38px;
  justify-content: space-between;
  position: relative;
  z-index: 10;

  .left,
  .right {
    align-items: center;
    display: flex;
    flex: 1 50%;
  }

  .left {
    border-right: 1px solid #aaa;
  }

  img {
    margin: 3px;
    margin-right: .6rem;
  }

  .icon {
    -webkit-app-region: no-drag;
    padding: 4px 5px;

    &:hover {
      color: #1f1f1f;
    }
  }

  .auto-right {
    margin-left: auto;
    margin-right: 2px;
    padding: 6px;
    padding-right: 0;
  }

  .auto-left {
    margin-left: 2px;
    margin-right: auto;
    padding: 6px;
    padding-left: 0;
  }

  .close {
    margin-right: 7px;
    padding: 0;
  }
}

.dark {
  .icon:hover {
    color: #777;
  }
}
</style>
