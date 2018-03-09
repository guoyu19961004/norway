/*
 * @Author: guoyu19961004
 * @Date:   2018-03-03 18:20:32
 * @Last Modified by:   Administrator
 * @Last Modified time: 2018-03-09 23:00:24
 */
const fs = require('fs')
const xml2js = require('xml2js')
const path = require('path')
const { remote } = require('electron')
const { Menu, MenuItem, dialog } = remote
const BrowserWindow = remote.BrowserWindow
const { exec, spawn } = require('child_process')

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

const jsonParser = new xml2js.Parser({
    explicitArray: false //一个子节点直接访问不生成数组
})
const confData = {
    'username': '',
    'password': '',
    'host': '',
    'source': '',
    'finish': ''
}
const global_souce_data = {
    'source_id': '',
    'source_name': '',
    'type': ''
}

const ingentia_path = path.join(__dirname, './environment/ingentia-run')
const Tmonkey_path = path.join(__dirname, './environment/Tmonkey/dm_tmonkey_sandbox')
const forumtest_path = path.join(__dirname, './environment/forumtest')

//判断目录是否存在
function checkDirExist(path) {
    try {
        return fs.existsSync(path);
    } catch (e) {
        if (e.code == 'ENOENT') { // no such file or directory. File really does not exist
            console.log("File does not exist.");
            return false;
        }
        console.log("Exception fs.statSync (" + path + "): " + e);
        throw e;
        // something else went wrong, we don't have rights, ...
    }
}

//检查是否是网址
function IsURL(str_url) {
    var re = new RegExp(/^(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/);
    return re.test(str_url)
}

/*链接source文件*/
function link_file(existingPath, newPath) {
    if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath)
    }
    fs.linkSync(existingPath, newPath)
}

/*cmd封装*/
function exe(command, options) {
    // windows下
    let cmd = spawn("cmd.exe", command, options);

    cmd.stdout.setEncoding("ASCII");
    cmd.stdout.on('data', (data) => {
        console.log("------------------------------");
        console.log("exec", command);
        console.log("stdout:" + data);
    });
    cmd.stderr.on('data', (data) => {
        console.log("------------------------------");
        console.log("stderr:" + data);
        console.log("------------------------------");
    });
    cmd.on('exit', (code) => {
        console.log(`子进程退出码：${code}`);
        console.log("------------------------------");
    });
}
/*调用JAVA下载网页*/
function download_url(url, encoding, callback) {
    $('#shell_info').empty();
    let java = spawn("java", ["-jar", "ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar", "-c", "clean", "tagsoup", url, encoding], { cwd: ingentia_path });
    java.stdout.setEncoding("ASCII");
    java.stdout.on('data', (data) => {
        if (data.toString() != '') {
            $('#shell_info').append('<p>' + data.toString() + '</p>')
        }
    });
    java.stderr.on('data', (data) => {
        if (data.toString() != '') {
            if (/Caused by/.test(data.toString())) {
                let start = data.toString().indexOf("Caused by:");
                let temp = data.toString().substring(start);
                let end = temp.indexOf("at java");
                $('#shell_info').append('<p style="color: red;">Error ' + $.trim(temp.substring(0, end)) + '<p>');
            }
        }
    });
    java.on('exit', (code) => {
        if (code == 0) {
            callback()
        } else {
            console.log(`子进程退出码：${code}`);
            console.log("------------------------------");
        }
    });
}
/*调用JAVA下载JS网页*/
function js_download_url(url, encoding, jsid, callback) {
    $('#shell_info').empty();
    let java = spawn("java", ["-jar", "ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar", "-c", "clean", "tagsoup", url, encoding, "-j", jsid], { cwd: ingentia_path });
    java.stdout.setEncoding("ASCII");
    java.stdout.on('data', (data) => {
        if (data.toString() != '') {
            $('#shell_info').append('<p>' + data.toString() + '</p>')
        }
    });
    java.stderr.on('data', (data) => {
        if (data.toString() != '') {
            if (/Caused by/.test(data.toString())) {
                let start = data.toString().indexOf("Caused by:");
                let temp = data.toString().substring(start);
                let end = temp.indexOf("at java");
                $('#shell_info').append('<p style="color: red;">Error' + $.trim(temp.substring(0, end)) + '<p>');
            }
        }
    });
    java.on('exit', (code) => {
        if (code == 0) {
            callback()
        } else {
            console.log(`子进程退出码：${code}`);
            console.log("------------------------------");
        }
    });
}
/*测试博客*/
function blog_run(callback) {
    $('#shell_info').empty();
    let java = spawn("java", ["-jar", "ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar", "-c", "blogthread"], { cwd: ingentia_path });
    java.stdout.setEncoding("ASCII");
    java.stdout.on('data', (data) => {
        if (data.toString() != '') {
            $('#shell_info').append('<p>' + data.toString() + '</p>')
        }
    });
    java.stderr.on('data', (data) => {
        if (data.toString() != '') {
            if (/Caused by/.test(data.toString())) {
                let start = data.toString().indexOf("Caused by:");
                let temp = data.toString().substring(start);
                let end = temp.indexOf("at java");
                $('#shell_info').append('<p style="color: red;">Error ' + $.trim(temp.substring(0, end)) + '<p>');
            }
        }
    });
    java.on('error', (err) => {
        console.error(`错误 ${err} 发生`);
    });
    java.on('exit', (code, signal) => {
        console.log(`子进程收到信号 ${signal} 而终止`);
        if (code == 0) {
            callback()
            console.log(`子进程退出码：${code}`);
        } else {
            console.log(`子进程退出码：${code}`);
            console.log("------------------------------");
        }
        $('#blog_stop_button').css("display", "none")
        $("#blog_stop_button").off("click", "**")
    });
    $('#blog_stop_button').css("display", "inline-block");
    $('#blog_stop_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        java.kill()
    });
    fs.watch(path.join(ingentia_path,"logs"), (eventType, filename) => {
        console.log(`事件类型是: ${eventType}`);
        if (filename == 'transformed.log') {
            if(eventType == 'rename') {
                if(fs.existsSync(path.join(ingentia_path,"logs",filename))) {
                    //生成HTML
                    $('#check_result').css('display', 'inline-block');
                }
            }
            console.log(`提供的文件名: ${filename}`);
        } else if (filename == 'errors.log') {
            if(eventType == 'rename') {
                if(fs.existsSync(path.join(ingentia_path,"logs",filename))) {
                    //查看错误信息
                    $('#check_error').css('display', 'inline-block');
                }
            }
        } else console.log('未提供文件名');
    });
}