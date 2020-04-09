<template>
  <div id="settings">
    <h3>
      MdEdit Settings
      <div
        v-if="iconsLoaded"
        id="closeSettings"
        title="Close Settings"
        @click="closeSettings"
      >
        <font-awesome-icon :icon="['fal', 'times']" />
      </div>
    </h3>

    <p>
      Theme:
      <select
        v-model="settings.selectedTheme"
        @change="updateTheme"
      >
        <option>Light</option>
        <option>Dark</option>
      </select>
    </p>

    <p>
      <label>
        Re-Open previously open file?
        <input
          v-model="settings.reopen"
          type="checkbox"
          class="hidden"
          @change="updateSetting('reopen', $event.target.checked)"
        >
        <span class="toggle" />
      </label>
    </p>

    <p>
      <label>
        Remember view layout?
        <input
          v-model="settings.layout"
          type="checkbox"
          class="hidden"
          @change="updateSetting('layout', $event.target.checked)"
        >
        <span class="toggle" />
      </label>
    </p>

    <p>
      <label>
        Show status bar?
        <input
          v-model="settings.showStatus"
          type="checkbox"
          class="hidden"
          @change="updateSetting('showStatus', $event.target.checked)"
        >
        <span class="toggle" />
      </label>
    </p>

    <div class="bottom">
      <img
        src="../assets/icon.png"
        width="128"
      >
      MdEdit v1.2.0
      <p>
        <a
          href="https://opensource.org/licenses/MIT"
          @click="openExternal"
        >MIT License</a> |
        <a
          href="https://github.com/kiswa/MdEdit"
          @click="openExternal"
        >GitHub Repo</a>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { shell } from 'electron'

export default Vue.extend({
  name: 'Settings',

  props: {
    iconsLoaded: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      settings: {
        theme: '',
        selectedTheme: '',
        reopen: null,
        layout: null,
        showStatus: null
      }
    }
  },

  mounted () {
    const settingsStr = localStorage.getItem('settings')
    this.settings = settingsStr
      ? JSON.parse(settingsStr)
      : {
        theme: 'light',
        selectedTheme: 'Light',
        reopen: false,
        layout: true,
        showStatus: false
      }
  },

  methods: {
    closeSettings () {
      this.$emit('closeSettings')
    },

    updateTheme (evt: Event) {
      const selectedTheme = (evt.target as HTMLSelectElement).value
      const theme = selectedTheme.toLowerCase()

      this.settings.selectedTheme = selectedTheme
      this.updateSetting('theme', theme)
    },

    updateSetting (name: string, value: string) {
      (this.settings as any)[name] = value
      localStorage.setItem('settings', JSON.stringify(this.settings))

      this.$emit('settingsChanged')
    },

    openExternal (evt: Event) {
      evt.stopPropagation()
      evt.preventDefault()

      shell.openExternal((evt.target as HTMLLinkElement).href)
    }
  }
})
</script>

<style lang="scss">
.dark {
  #settings {
    background-color: #303030;

    #closeSettings {
      &:hover {
        color: #777;
      }
    }
  }
}

#settings {
  background-color: #fefefe;

  #closeSettings {
    float: right;

    &:hover {
      color: #333;
    }
  }
}
</style>

<style lang="scss" scoped>
#settings {
  bottom: 0;
  box-shadow: 2px 2px 2px 0 rgba(0, 0, 0, .14),
              2px 1px 5px 0 rgba(0, 0, 0, .12),
              2px 3px 1px -2px rgba(0, 0, 0, .2);
  cursor: default;
  left: 0;
  min-width: 17rem;
  position: absolute;
  top: 39px;
  user-select: none;
  width: 25%;
  z-index: 10;

  h3 {
    border-bottom: 1px solid #aaa;
    margin: 0;
    padding: 1rem;
    padding-bottom: .3rem;
  }

  p {
    padding: 0 1rem;
  }

  select {
    -webkit-appearance: button;
    -webkit-padding-end: 30px;
    -webkit-padding-start: 2px;
    background-color: inherit;
    background-image: url('../assets/dropdown-arrow.png'),
                      linear-gradient(#fefefe, #fefefe);
    background-position: right center;
    background-repeat: no-repeat;
    border: 1px solid #AAA;
    border-radius: 2px;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
    color: inherit;
    font-size: inherit;
    margin: 0;
    outline: 0;
    overflow: hidden;
    padding: 0 30px 2px 10px;
    text-overflow: ellipsis;
    user-select: none;
    white-space: nowrap;
  }

  .bottom {
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    text-align: center;

    img {
      display: block;
      margin: 0 auto;
    }
  }

  .hidden {
    display: none;
  }

  .toggle {
    cursor: pointer;
    position: relative;

    &::before {
      background-color: #aaa;
      border-radius: 4px;
      content: '';
      display: inline-block;
      padding: 5px 10px;
      text-align: right;
      transition: background 600ms;
      width: 28px;
    }

    &::after {
      background-color: #eee;
      border: 1px solid #aaa;
      border-radius: 50%;
      content: '';
      display: inline-block;
      height: 17px;
      left: -2px;;
      position: absolute;
      top: 3px;
      transition: transform 300ms;
      width: 17px;
    }
  }

  .hidden:checked + .toggle {
    &::before {
      background-color: #604b7f;
      content: '';
      text-align: left;
    }

    &::after {
      transform: translate(15px);
    }
  }
}
</style>
