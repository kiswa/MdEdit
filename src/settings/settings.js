const remote = require('electron').remote;
const { shell, ipcRenderer } = require('electron');

const close = document.getElementById('close');

const reopen = document.getElementById('reopen');
const layout = document.getElementById('layout');
const theme = document.getElementById('theme');

const version = document.getElementById('version');
const ghLink = document.getElementById('github');

reopen.checked = localStorage.getItem('reopen') === 'true';
layout.checked = localStorage.getItem('layout') === 'true';
theme.value = localStorage.getItem('theme');

document.body.classList.add(localStorage.getItem('theme'));

version.innerHTML = remote.app.getVersion();

close.onclick = () => {
    remote.getCurrentWindow().close();
}

reopen.onclick = () => {
    localStorage.setItem('reopen', reopen.checked);
}

layout.onclick = () => {
    localStorage.setItem('layout', layout.checked);
}

theme.onchange = () => {
    localStorage.setItem('theme', theme.value);

    document.body.classList.remove('dark');
    document.body.classList.remove('light');
    document.body.classList.add(localStorage.getItem('theme'));

    ipcRenderer.send('update-theme');
}

ghLink.onclick = (event) => {
    event.preventDefault();
    shell.openExternal(event.target.href);
}

