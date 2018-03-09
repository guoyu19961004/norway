const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
//引入小图标
const Tray = electron.Tray
const nativeImage = electron.nativeImage
//引入menu
const Menu = electron.Menu
//引入menuIteam
const MenuItem = electron.MenuItem

const path = require('path')
const url = require('url')
const fs = require('fs')
const xml2js = require('xml2js')

const jsonParser = new xml2js.Parser({
    explicitArray: false //一个子节点直接访问不生成数组
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let tray
let menu

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 800, height: 600 })
    menu = new Menu()
    let tray_menu = new Menu()
    let image = nativeImage.createFromPath('app/images/icon.ico')
    tray = new Tray(image)
    menu.append(program_menuIteam)
    menu.append(edit_menuIteam)
    menu.append(window_menuIteam)
    menu.append(help_menuIteam)
    //设置窗口内菜单
    Menu.setApplicationMenu(menu)
    //设置小图标菜单
    tray_menu = Menu.buildFromTemplate(tray_menu_template)
    tray.setContextMenu(tray_menu)
    //创建菜单
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app/index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


//创建一个menuIteam
const program_menuIteam = new MenuItem({
    label: "项目",
    submenu: [{
            //创建一个新的窗口
            label: "设置",
            accelerator: "CmdOrCtrl+Shift+S",
            role: "",
            click() {
                let newwindow = new BrowserWindow({
                    width: 500,
                    height: 400,
                    resizable: false
                })
                newwindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'app/settings.html'),
                    protocol: 'file:',
                    slashes: true
                }))
                newwindow.on("closed", function() {
                    newwindow = null
                })
            }
        },
        {
            //可以调用role默认的同时重写一些需要的内容
            label: "退出",
            role: "quit"
        }
    ]
});

const edit_menuIteam = new MenuItem({
    label: "编辑",
    submenu: [{
        label: "撤回",
        role: "undo"
    }, {
        label: "反撤回",
        role: "redo"
    }, {
        label: "剪切",
        role: "cut"
    }, {
        label: "复制",
        role: "copy"
    }, {
        label: "粘贴",
        role: "paste"
    }, {
        label: "保留格式粘贴",
        role: "pasteandmatchstyle"
    }, {
        label: "删除",
        role: "delete"
    }, {
        label: "全选",
        role: "selectall"
    }]
});

const window_menuIteam = new MenuItem({
    label: "窗口",
    submenu: [{
        label: "重新加载",
        role: "reload"
    }, {
        label: "重新加载忽略缓存",
        role: "forcereload"
    }, {
        label: "开发者工具",
        role: "toggledevtools"
    }, {
        label: "全屏",
        role: "togglefullscreen"
    }, {
        label: "最小化",
        role: "minimize"
    }, {
        label: "关闭",
        role: "close"
    }]
});

const help_menuIteam = new MenuItem({
    label: "帮助",
    click() {
        let newwindow = new BrowserWindow({
            width: 500,
            height: 400,
            resizable: false
        })
        newwindow.loadURL(url.format({
            pathname: path.join(__dirname, 'app/index.html'),
            protocol: 'file:',
            slashes: true
        }))
        newwindow.on("closed", function() {
            newwindow = null
        })
    }
});

const tray_menu_template = [{
    label: "设置",
    click() {
        let newwindow = new BrowserWindow({
            width: 500,
            height: 400,
            resizable: false
        })
        newwindow.loadURL(url.format({
            pathname: path.join(__dirname, 'app/settings.html'),
            protocol: 'file:',
            slashes: true
        }))
        newwindow.on("closed", function() {
            newwindow = null
        })
    }
}, {
    label: "帮助",
    click() {
        let newwindow = new BrowserWindow({
            width: 500,
            height: 400,
            resizable: false
        })
        newwindow.loadURL(url.format({
            pathname: path.join(__dirname, 'app/index.html'),
            protocol: 'file:',
            slashes: true
        }))
        newwindow.on("closed", function() {
            newwindow = null
        })
    }
}, {
    label: "退出",
    role: "quit"
}]