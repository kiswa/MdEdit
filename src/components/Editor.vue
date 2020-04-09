<template>
  <div>
    <textarea
      id="editor"
      :value="markdown"
      wrap="soft"
      @input="updateMarkdown"
      @scroll="updateScroll"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Editor',

  props: {
    markdown: {
      type: String,
      default: ''
    },

    scrollPercent: {
      type: Number,
      default: 0
    }
  },

  watch: {
    scrollPercent (percent) {
      const editor = document.getElementById('editor') as HTMLInputElement
      const height = editor.scrollHeight
      const clientHeight = editor.clientHeight

      editor.scrollTop = percent * (height - clientHeight)
    }
  },

  methods: {
    updateMarkdown (event: InputEvent) {
      this.$emit('markdownChanged', (event.target as HTMLTextAreaElement).value)
    },

    updateScroll () {
      this.$emit('scrolled', this.calcPercent())
    },

    calcPercent () {
      const editor = document.getElementById('editor') as HTMLTextAreaElement
      const scrollTop = editor.scrollTop
      const height = editor.scrollHeight
      const clientHeight = editor.clientHeight

      return scrollTop / (height - clientHeight)
    }
  }
})
</script>

<style lang="scss">
.left.full > div > textarea {
  padding-left: 20%;
  padding-right: 20%;
}
</style>

<style lang="scss" scoped>
div {
  height: 100%;
}

textarea {
  background: transparent;
  border: 0;
  display: block;
  height: 100%;
  outline: 0;
  overflow-y: scroll;
  padding: 1rem;
  resize: none;
  width: 100%;
}
</style>
