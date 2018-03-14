// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const electron = require('electron')
const fs = require('fs')
const path = require('path')

const resource_path = path.join(__dirname, '../resources')
const root_path = path.join(__dirname, '../')


$(document).ready(function() {
    if (fs.existsSync(path.join(resource_path, 'settings.xml'))) {
        //读取settings.xml
        let conf = fs.readFileSync(path.join(resource_path, 'settings.xml'));
        if (conf) {
            jsonParser.parseString(conf, function(err, result) {
                updateConf(result.norway)
            });
        } else {
            alert('settings.xml为空!');
        }
    } else {
        fs.writeFileSync(path.join(resource_path, 'settings.xml'), jsonBuilder.buildObject(confData));
    }
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
            saveConfByForm()
            console.log(remote.getCurrentWindow())
            fs.writeFileSync(path.join(resource_path, 'settings.xml'), jsonBuilder.buildObject(confData));
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
function saveConfByForm() {
    confData.username = $('#username').val()
    confData.password = $('#password').val()
    confData.source = $('#source').val()
    confData.host = $('#host').val()
    confData.finish = $('#finish').val()
}