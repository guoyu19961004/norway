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

    $('#settingForm').validate({
        submitHandler: function(form) {
            saveConf(confData)
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
function saveConf() {
    confData.username = $('#username').val()
    confData.password = $('#password').val()
    confData.source = $('#source').val()
    confData.host = $('#host').val()
    confData.finish = $('#finish').val()
}