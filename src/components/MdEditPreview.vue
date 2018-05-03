<template>
  <div class="preview" v-html="compiledMarkdown">
  </div>
</template>

<script>
import marked from 'marked'
import hljs from 'highlight.js'
import { shell } from 'electron'

export default {
  name: 'MdEditPreview',

  props: {
    markdown: {
      default: '',
      type: String
    },

    scrollPercent: {
      default: 0,
      type: Number
    },

    filePath: {
      default: '',
      type: String
    }
  },

  created () {
    const renderer = new marked.Renderer()

    renderer.listitem = text => {
      if (/^\s*\[[x ]\]\s*/.test(text)) {
        text = text
          .replace(/^\s*\[ \]\s*/,
            '<i class="icon icon-check-empty"></i> ')
          .replace(/^\s*\[x\]\s*/,
            '<i class="icon icon-check"></i> ')
        return '<li class="checklist">' + text + '</li>'
      }

      return '<li>' + text + '</li>'
    }

    renderer.image = (href, title, text) => {
      if (href.indexOf('http') !== 0) {
        href = 'file:///' + this.filePath + href
      }

      let m
      let size = ''

      if (title && (m = title.match(/^(\d+)x(\d+)$/))) {
        size = ' width="' + m[1] + '" height="' + m[2] + '"'
      }

      return '<img src="' + href + '" alt="' + text + '"' +
        (title ? ' title="' + title + '"' : '') + size + '>'
    }

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true,
      tables: true,
      smartypants: true,
      langPrefix: '',
      highlight: (code) => {
        return hljs.highlightAuto(code).value
      }
    })
  },

  watch: {
    scrollPercent (percent) {
      const preview = document.getElementById('preview')
      const height = preview.scrollHeight
      const clientHeight = preview.clientHeight

      const oldScroll = preview.onscroll

      preview.onscroll = undefined
      preview.scrollTop = percent * (height - clientHeight)
      preview.scroll = oldScroll
    },

    compiledMarkdown () {
      setTimeout(this.updateLinks, 10)
    }
  },

  computed: {
    compiledMarkdown () {
      return marked(this.markdown)
    }
  },

  methods: {
    updateLinks () {
      Array.from(document.getElementsByTagName('a'))
        .forEach(link => {
          link.onclick = evt => {
            if (evt.target.hostname === 'localhost' && evt.target.hash.length) {
              return
            }

            evt.stopPropagation()
            evt.preventDefault()
            shell.openExternal(evt.target.href)
          }
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.preview {
  margin: 0 auto;
  max-width: 100%;
  padding: 1rem;
}

.full {
  .preview {
    max-width: 65%;
  }
}
</style>

<style lang="scss">
@import url('../../node_modules/highlight.js/styles/tomorrow-night-eighties.css');

a {
  color: #604b7f;
}

img {
  max-width: 100%;
}

pre,
code {
  background-color: #eee;
  border-radius: 3px;
  font-family: 'Source Code Pro';
  font-size: .9em;
  padding: 1px;
}

pre {
  padding: .5rem;
  overflow: auto;
}

table {
  border-collapse: collapse;
  width: 100%;

  thead {
    background-color: #eee;
    border-bottom: 1px solid #aaa;
  }

  tr:nth-child(even) {
    background-color: #eee;
  }

  td {
    padding: 2px;
  }
}

blockquote {
  border-left: 3px solid #aaa;
  font-size: .9em;
  margin-left: 0;
  padding-left: 2rem;
}

kbd {
  background-color: #fefefe;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14),
              0 1px 5px 0 rgba(0, 0, 0, .12),
              0 3px 1px -2px rgba(0, 0, 0, .2);
  font-size: .9em;
  padding: 1px 4px;
}

.checklist {
  list-style: none;
  margin-left: -1.3rem;

  .icon {
    font-style: normal;
    margin-right: .3rem;
  }

  .icon-check-empty::after {
    content: '☐';
  }

  .icon-check::after {
    content: '☑';
  }
}

.dark {
  a {
    color: #8064aa;
  }

  thead {
    background-color: #4f4f4f;
    border-bottom: 1px solid #aaa;
  }

  tr:nth-child(even),
  pre,
  code {
    background-color: #4f4f4f;
  }

  kbd {
    background-color: #4f4f4f;
    border: 1px solid #777;
    box-shadow: 0 2px 2px 0 rgba(255, 255, 255, .14),
                0 1px 5px 0 rgba(255, 255, 255, .12),
                0 3px 1px -2px rgba(255, 255, 255, .2);
  }
}
</style>
