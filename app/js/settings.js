// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const electron = require('electron')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')
const { remote } = require('electron')
const { dialog } = remote

const resource_path = path.join(__dirname, '../resources')
const root_path = path.join(__dirname, '../')

//创建builder的时候参数说明：
//rootName (default root or the root key name)
//renderOpts (default { 'pretty': true, 'indent': ' ', 'newline': '\n' })
//xmldec (default { 'version': '1.0', 'encoding': 'UTF-8', 'standalone': true }
//headless (default: false)
//cdata (default: false): wrap text nodes in <![CDATA[ ... ]]>
const jsonBuilder = new xml2js.Builder({
    rootName: 'norway',
    renderOpts: {
        pretty: true,
        indent: '    '
    },
    xmldec: {
        'version': '1.0',
        'encoding': 'UTF-8',
        'standalone': true
    }
}) // jons -> xml

$(document).ready(function() {
    updateConf(window.localStorage)
    $('#source_choose_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        dialog.showOpenDialog({
            title: '选择Source存放目录',
            properties: ['openDirectory']
        }, function(filePaths) {
            if (filePaths) {
                $('#source').val(filePaths[0])
            }
        })
    });
    $('#finish_choose_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        dialog.showOpenDialog({
            title: '选择finish目录',
            properties: ['openDirectory']
        }, function(filePaths) {
            if (filePaths) {
                $('#finish').val(filePaths[0])
            }
        })
    });
    $('#settingForm').validate({
        rules: {
            username: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minlength: 6
            },
            web: {
                required: true,
                url: true
            },
            source_path: "required",
            finish_path: "required",
        },
        messages: {
            username: {
                required: "请输入用户名"
            },
            password: {
                required: "请输入密码",
                minlength: "密码长度不能小于 6 个字符"
            },
            web: {
                required: "请输入Tmonkey网址"
            },
            source_path: "请选择或输入Source存放目录",
            finish_path: "请选择或输入Finish存放目录"
        },
        submitHandler: function(form) {
            saveConf()
            fs.writeFileSync(path.join(resource_path, 'settings.xml'), jsonBuilder.buildObject(window.localStorage));
            alert('设置已保存');
            remote.getCurrentWindow().close()
        },
        errorElement: 'em'
    });
});

//函数

//显示设置参数
function updateConf(conf) {
    $('#username').val(conf.username)
    $('#password').val(conf.password)
    $('#source').val(conf.source)
    $('#host').val(conf.host)
    $('#finish').val(conf.finish)
}



//保存设置参数
function saveConf() {
    window.localStorage.username = $('#username').val()
    window.localStorage.password = $('#password').val()
    window.localStorage.source = $('#source').val()
    window.localStorage.host = $('#host').val()
    window.localStorage.finish = $('#finish').val()
}