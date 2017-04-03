# ![MdEdit Icon](../assets/icon.png) MdEdit

MdEdit is a minimalist Markdown editor that lets you write Markdown files with a live preview and otherwise stays out of your way.

![MdEdit](../.github/MdEdit.png)

Head over to the [releases](https://github.com/kiswa/MdEdit/releases) to get the version for your system!

There are just a few options in the Settings, including a dark theme:

![MdEdit Settings](../.github/MdEdit_settings.png)

![MdEdit Settings](../.github/MdEdit_settings_dark.png)

## Development

MdEdit uses [Electron](https://electron.atom.io/) and is written in JavaScript, HTML, and CSS. The code could be improved with refactoring and cleanup, but is functional enough for a first release.

If you want to develop for MdEdit it's very simple:

 * Clone the repo: `git clone https://github.com/kiswa/MdEdit`
 * Install dependencies: `npm i`
 * Run it: `electron .`

## Thanks To

In addition to Electron, MdEdit is built with the following open-source projects:

 * [marked](https://github.com/chjj/marked) - Fast Markdown parsing
 * [highlight.js](https://github.com/isagalaev/highlight.js) - Code highlighting
 * [electron-packager](https://github.com/electron-userland/electron-packager) - Generates releases for all targets
 * [Mousetrap](https://github.com/ccampbell/mousetrap) - Handles keyboard shortcuts
 * [Font Awesome](http://fontawesome.io/) - Icons
 * [Source Code Pro](https://github.com/adobe-fonts/source-code-pro) - Font