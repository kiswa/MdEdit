module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'com.kiswa.mdedit',
        productName: 'MdEdit',
        // eslint-disable-next-line no-template-curly-in-string
        copyright: 'Copyright © 2017-2019 ${author}',
        linux: {
          category: 'TextEditor',
          target: [
            {
              target: 'AppImage'
            },
            {
              target: 'snap'
            },
            {
              target: 'pacman'
            },
            {
              target: 'deb'
            }
          ]
        }
      }
    }
  }
}

