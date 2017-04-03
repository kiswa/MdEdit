const marked = require('marked');
const hljs = require('highlight.js');
const shortcuts = require('../assets/mousetrap.min.js');

const remote = require('electron').remote;
const dialog = remote.dialog;
const { shell, ipcRenderer } = require('electron');
const fs = require('fs');

const editor = document.querySelector('.editor');
const preview = document.querySelector('.preview');

const newFile = document.getElementById('new');
const openFile = document.getElementById('open');
const saveFile = document.getElementById('save');
const settings = document.getElementById('settings');
const expandEditor = document.getElementById('expandEditor');
const expandPreview = document.getElementById('expandPreview');
const close = document.getElementById('close');
const notification = document.getElementById('notification');

let currentFile = remote.getGlobal('fileToOpen');
let isEdited = false;
let editorState = Number(localStorage.getItem('editorState')); // -1 = collapsed, 0 = 50%, 1 = 100%

if (!editorState || isNaN(editorState)) {
    editorState = 0;
    localStorage.setItem('editorState', 0);
}

if (currentFile && currentFile !== '') {
    loadFile(currentFile);
}

if (localStorage.getItem('reopen') === 'true' && localStorage.getItem('lastFile')) {
    try {
        loadFile(localStorage.getItem('lastFile'));
    } catch (ex) {
        // Ignore
    }
}

initShortcuts();
initLocalStorage();
initLayout();
document.body.classList.add(localStorage.getItem('theme'));

remote.ipcMain.on('update-theme', () => {
    document.body.classList.remove('dark');
    document.body.classList.remove('light');
    document.body.classList.add(localStorage.getItem('theme'));
});

ipcRenderer.on('open-file', (event, arg) => {
    loadFile(arg);
});

newFile.onclick = () => {
    if (!isEdited) {
        resetEditor();
        return;
    }

    dialog.showMessageBox({
        cancelId: 1,
        type: 'question',
        message: 'You have unsaved changes, discard?',
        buttons: ['OK', 'Cancel']
    }, (buttonId) => {
        if (buttonId === 0) {
            resetEditor();
        }
    });
}

openFile.onclick = () => {
    dialog.showOpenDialog({
        title: 'Select a file to edit',
        filters: [
            { name: 'Markdown Documents', extensions: ['md', 'markdown'] }
        ]
    }, filenames => {
        if (!filenames || filenames.length === 0) {
            return;
        }

        loadFile(filenames[0]);
    });
};

saveFile.onclick = () => {
    if (currentFile !== '') {
        fs.writeFileSync(currentFile, editor.value);

        isEdited = false;
        notifySaved();
        return;
    }

    dialog.showSaveDialog({
        title: 'Save Markdown File',
        filters: [
            { name: 'Markdown Documents', extensions: [ 'md', 'markdown' ] }
        ]
    }, filename => {
        fs.writeFileSync(filename, editor.value);

        currentFile = filename;
        isEdited = false;
        notifySaved();
    });
};

settings.onclick = () => {
    let settingsWin = new remote.BrowserWindow({
        frame: false,
        modal: true,
        height: 400,
        parent: remote.getCurrentWindow(),
        show: false,
        width: 700
    });

    settingsWin.once('ready-to-show', () => {
        settingsWin.show();
        settingsWin.focus();
    });

    settingsWin.loadURL(require('url').format({
        pathname: require('path').
            join(__dirname, 'settings/settings.html'),
        protocol: 'file:',
        slashes: true
    }));

    settingsWin.on('closed', () => {
        settingsWin = null;
    });
};

close.onclick = () => {
    let win = remote.getCurrentWindow();

    if (!isEdited) {
        win.close();
    }

    dialog.showMessageBox({
        cancelId: 1,
        type: 'question',
        message: 'Close without saving?',
        buttons: ['OK', 'Cancel']
    }, (buttonId) => {
        if (buttonId === 0) {
            win.close();
        }

        editor.focus();
    });
}

expandEditor.onclick = () => {
    switch (editorState) {
        case -1:
            editor.classList.remove('collapsed');
            preview.classList.remove('expanded');
            editorState = 0;
            break;
        case 0:
            editor.classList.add('expanded');
            preview.classList.add('collapsed');
            editorState = 1;
            break;
    }

    localStorage.setItem('editorState', editorState);
}

expandPreview.onclick = () => {
    switch (editorState) {
        case 0:
            editor.classList.add('collapsed');
            preview.classList.add('expanded');
            editorState = -1;
            break;
        case 1:
            editor.classList.remove('expanded');
            preview.classList.remove('collapsed');
            editorState = 0;
            break;
    }

    localStorage.setItem('editorState', editorState);
}

notification.onclick = () => {
    notification.classList.add('hidden');
}

function initShortcuts() {
    shortcuts.bind([ 'command+n', 'ctrl+n' ], () => { newFile.click() });
    shortcuts.bind([ 'command+o', 'ctrl+o' ], () => { openFile.click() });
    shortcuts.bind([ 'command+s', 'ctrl+s' ], () => { saveFile.click() });
}

function initLayout() {
    let rememberLayout = localStorage.getItem('layout') === 'true';

    if (!rememberLayout) {
        editorState = 0;
        return;
    }

    switch (editorState) {
        case -1:
            editor.classList.add('collapsed');
            preview.classList.add('expanded');
            break;
        case 1:
            editor.classList.add('expanded');
            preview.classList.add('collapsed');
            break;
    }
}

function resetEditor() {
    currentFile = '';
    localStorage.removeItem('lastFile');
    editor.value = '';
    isEdited = false;

    editor.focus();
    generatePreview();
}

function notifySaved() {
    notification.innerText = 'Saved file ' + currentFile;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 2000);
}

function loadFile (filename) {
    var contents = fs.readFileSync(filename);

    currentFile = filename;
    localStorage.setItem('lastFile', currentFile);
    isEdited = false;
    remote.app.addRecentDocument(filename);

    editor.value = contents;
    editor.selectionStart = 0;
    editor.selectionEnd = 0;
    editor.focus();

    generatePreview();
}

function generatePreview() {
    var renderer = new marked.Renderer();

    renderer.listitem = function (text, level) {
        if (/^\s*\[[x ]\]\s*/.test(text)) {
            text = text
                .replace(/^\s*\[ \]\s*/, '<i class="icon-box" style="margin-right:-4px"></i> ')
                .replace(/^\s*\[x\]\s*/, '<i class="icon-checked" style="margin-right:-4px"></i> ');
            return '<li style="list-style: none; margin-left: -27px;">' + text + '</li>';
        } else {
            return '<li>' + text + '</li>';
        }
    };

    renderer.link = function(href, title, text) {
        var out = '<a href="' + href + '"';
        if (title) {
            out += ' title="' + title + '"';
        }
        out += ' onclick="externalLink(event)">' + text + '</a>';

        return out;
    };

    marked.setOptions({
        renderer,
        smartypants: true,
        highlight: code => {
            return hljs.highlightAuto(code).value;
        }
    });

    let content = editor.value;
    let html = marked(content);

    preview.innerHTML = html;
}

function externalLink(event) {
    event.preventDefault();
    shell.openExternal(event.target.href);
}

function initLocalStorage() {
    var test = localStorage.getItem('theme');

    if (!test) {
        localStorage.setItem('reopen', false);
        localStorage.setItem('layout', false);
        localStorage.setItem('theme', 'light');
    }
}

function checkShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 'n':
                newFile.click();
                break;
            case 'o':
                openFile.click();
                break;
            case 's':
                saveFile.click();
                break;
        }

        return true;
    }

    return false;
}

editor.onkeyup = event => {
    let isCommand = checkShortcuts(event);

    if (!isCommand) {
        isEdited = true;
        generatePreview();
    }
}

let isSyncingEditor = false;
let isSyncingPreview = false;

editor.onscroll = function() {
    if (isSyncingPreview) {
        isSyncingPreview = false;
        return;
    }

    isSyncingEditor = true;
    preview.scrollTop = editor.scrollTop;
}

preview.onscroll = function() {
    if (isSyncingEditor) {
        isSyncingEditor = false;
        return;
    }

    isSyncingPreview = true;
    editor.scrollTop = preview.scrollTop;
}


