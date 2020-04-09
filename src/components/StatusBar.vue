<template>
  <div id="status">
    <div>{{ filename }}</div>
    <div>{{ fileStatus }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'StatusBar',

  props: {
    isEdited: {
      type: Boolean,
      default: false
    },

    filename: {
      type: String,
      default: 'File not yet saved.'
    }
  },

  data () {
    return {
      fileStatus: ''
    }
  },

  watch: {
    isEdited () {
      this.fileStatus = this.isEdited ? 'Unsaved Changes' : ''
    }
  }
})
</script>

<style lang="scss" scoped>
#status {
  border-top: 1px solid #aaa;
  display: flex;
  font-size: .9em;
  height: 28px;
  justify-content: space-between;
  width: 100%;

  div {
    line-height: 28px;
    padding: 0 5px;
  }
}
</style>
