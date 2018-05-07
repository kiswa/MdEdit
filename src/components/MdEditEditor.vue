<template>
  <div>
    <textarea id="editor" :value="markdown" wrap="soft"
      @input="updateMarkdown"
      @scroll="updateScroll">
    </textarea>
  </div>
</template>

<script>
export default {
  name: 'MdEditEditor',

  props: {
    markdown: {
      default: '',
      type: String
    },

    scrollPercent: {
      default: 0,
      type: Number
    }
  },

  watch: {
    scrollPercent (percent) {
      const editor = document.getElementById('editor')
      const height = editor.scrollHeight
      const clientHeight = editor.clientHeight

      editor.scrollTop = percent * (height - clientHeight)
    }
  },

  methods: {
    updateMarkdown (event) {
      this.$emit('markdownChanged', event.target.value)
    },

    updateScroll () {
      this.$emit('scrolled', this.calcPercent())
    },

    calcPercent () {
      const editor = document.getElementById('editor')
      const scrollTop = editor.scrollTop
      const height = editor.scrollHeight
      const clientHeight = editor.clientHeight

      return scrollTop / (height - clientHeight)
    }
  }
}
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
