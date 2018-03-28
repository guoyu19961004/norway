/*
 * @Author: guoyu19961004
 * @Date:   2018-03-03 18:20:32
 * @Last Modified by:   guoyu19961004
 * @Last Modified time: 2018-03-28 10:59:28
 */
const fs = require('fs')
const xml2js = require('xml2js')
const path = require('path')
const url = require('url')
const { remote } = require('electron')
const { Menu, MenuItem, dialog } = remote
const BrowserWindow = remote.BrowserWindow
const { exec, spawn } = require('child_process')
const readline = require('readline')
const os = require('os')

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
const resource_path = path.join(__dirname, './resources')
const root_path = path.join(__dirname, './')


//判断设置的配置文件是否存在
function judge_settings() {
    console.log(resource_path)
    if (fs.existsSync(path.join(resource_path, 'settings.xml'))) {
        //读取settings.xml
        let conf = fs.readFileSync(path.join(resource_path, 'settings.xml'));
        if (conf) {
            jsonParser.parseString(conf, function(err, result) {
                saveConf(result.norway)
                get_source_info(result.norway)
            })
        } else {
            alert('settings.xml为空!')
        }
    } else {
        openSettings()
    }
}

//保存settings
function saveConf(argument) {
    confData.username = argument.username
    confData.password = argument.password
    confData.source = argument.source
    confData.host = argument.host
    confData.finish = argument.finish
}

//打开设置页
function openSettings() {
    let newwindow = new BrowserWindow({
        width: 500,
        height: 600,
        resizable: false
    })
    newwindow.loadURL(url.format({
        pathname: path.join(root_path, 'settings.html'),
        protocol: 'file:',
        slashes: true
    }))
    newwindow.setMenu(null)
    newwindow.on("closed", function() {
        remote.getCurrentWindow().webContents.reload()
        newwindow = null
    })
}

//获取Tmonkey web中source信息存放到resources/sources.xml
function get_source_info(argument) {
    $.ajax({
        type: "POST",
        url: argument.host,
        data: {
            username: argument.username,
            password: argument.password,
            login: 'Login'
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            Materialize.toast(textStatus, 2000)
        },
        success: function(msg) {
            $.ajax({
                type: "GET",
                url: path.join(argument.host, 'api/outsource/source/'),
                dataType: 'json',
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    Materialize.toast('登录失败！请确定账号密码！', 2000)
                    openSettings()
                },
                success: function(sources) {
                    Materialize.toast('登录成功！', 2000)
                    let xml = ''
                    let source = {
                        source: sources
                    }
                    if (!checkDirExist(resource_path)) fs.mkdirSync(resource_path)
                    xml = jsonBuilder.buildObject(source)
                    fs.writeFileSync(path.join(resource_path, 'sources.xml'), xml)
                    Materialize.toast('Sources 数量更新完毕！', 3000)
                }
            })
        }
    })
}

/*根据当前环境静默配置环境*/
function change_env_path() {
    /*更改dm_tmonkey_sandbox/tmonkeysettings.py 第79 80行*/
    let index = 1,
        temp_path = path.join(Tmonkey_path, 'tmonkeysettings_temp.txt'),
        setting_path = path.join(Tmonkey_path, 'tmonkeysettings.py')
    let fWrite = fs.createWriteStream(temp_path)
    let rl = readline.createInterface({
        input: fs.createReadStream(setting_path),
        output: fWrite,
        crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        let tmp_path, tmp
        switch (index) {
            case 79:
                if (/SUBSOURCE_CRAWLER_ROOT_PATH/.test(line)) {
                    tmp_path = confData.finish.replace(/\\/g, '/')
                    tmp = line.replace(/"\S+"$/, '"' + tmp_path + '"')
                    fWrite.write(tmp + os.EOL)
                } else fWrite.write(line + os.EOL)
                break;
            case 80:
                if (/SUBSOURCE_CRAWLER_CONFIG_FILE_PATH/.test(line)) {
                    tmp_path = path.join(confData.finish, 'SubSourceCrawlerConfig.xml').replace(/\\/g, '/')
                    tmp = line.replace(/"\S+\.xml"$/, '"' + tmp_path + '"')
                    fWrite.write(tmp + os.EOL)
                } else fWrite.write(line + os.EOL)
                break;
            default:
                fWrite.write(line + os.EOL)
        }
        index++;
    });
    rl.on('close', () => {
        fs.unlinkSync(setting_path);
        fs.linkSync(temp_path, setting_path);
        fs.unlinkSync(temp_path);
        change_forumtest_env_path()
        console.log('tmonkeysettings.py settings was changed to ' + confData.finish);
    });
}

/*更改forumtest/bin/settings.py 第10行*/
function change_forumtest_env_path() {
    let index = 1,
        temp_path = path.join(forumtest_path, 'bin/setting_temp.txt'),
        setting_path = path.join(forumtest_path, 'bin/setting.py')
    let fWrite = fs.createWriteStream(temp_path)
    let rl = readline.createInterface({
        input: fs.createReadStream(setting_path),
        output: fWrite,
        crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        let tmp_path, tmp
        switch (index) {
            case 10:
                if (/BASE_DIR/.test(line)) {
                    tmp_path = forumtest_path.replace(/\\/g, '/')
                    tmp = line.replace(/"\S+"$/, '"' + tmp_path + '"')
                    fWrite.write(tmp + os.EOL)
                } else fWrite.write(line + os.EOL)
                break
            default:
                fWrite.write(line + os.EOL)
                break
        }
        index++;
    });
    rl.on('close', () => {
        fs.unlinkSync(setting_path);
        fs.linkSync(temp_path, setting_path);
        fs.unlinkSync(temp_path);
        change_tmonkey_ingentia_env_path()
        console.log('forumtest setting.py settings was changed to ' + forumtest_path);
    });
}

/*更改monkeyeggs/subsourcecrawleregg-ingentia.py 第351行*/
function change_tmonkey_ingentia_env_path() {
    let index = 1,
        temp_path = path.join(Tmonkey_path, 'monkeyeggs/subsourcecrawleregg-ingentia_temp.txt'),
        setting_path = path.join(Tmonkey_path, 'monkeyeggs/subsourcecrawleregg-ingentia.py')
    let fWrite = fs.createWriteStream(temp_path)
    let rl = readline.createInterface({
        input: fs.createReadStream(setting_path),
        output: fWrite,
        crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        let tmp_path, tmp
        switch (index) {
            case 351:
                if (/ingentia_root_path/.test(line)) {
                    tmp_path = ingentia_path.replace(/\\/g, '/')
                    tmp = line.replace(/"\S+"$/, '"' + tmp_path + '"')
                    fWrite.write(tmp + os.EOL)
                } else fWrite.write(line + os.EOL)
                break;
            default:
                fWrite.write(line + os.EOL)
        }
        index++;
    });
    rl.on('close', () => {
        fs.unlinkSync(setting_path);
        fs.linkSync(temp_path, setting_path);
        fs.unlinkSync(temp_path);
        Materialize.toast('配置文件更改完成', 3000)
        console.log('subsourcecrawleregg-ingentia.py settings was changed to ' + ingentia_path);
    });
}

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

/*链接source文件*/
function link_file(existingPath, newPath) {
    if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath)
    }
    fs.linkSync(existingPath, newPath)
}

/*调用JAVA下载网页*/
function download_url(url, encoding, callback) {
    $('#shell_info').empty();
    let java = spawn("java", ["-jar", "ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar", "-c", "clean", "tagsoup", url, encoding], { cwd: ingentia_path });
    java.stdout.setEncoding("ASCII");
    const stdoutRl = readline.createInterface({
        input: java.stdout,
        crlfDelay: Infinity
    });
    stdoutRl.on('line', (line) => {
        if (/Caused by:/.test(line)) {
            $('#shell_info').append('<p style="color: red;">' + line + '<p>');
        } else $('#shell_info').append('<p>' + line + '</p>');
    });
    const stderrRl = readline.createInterface({
        input: java.stderr,
        crlfDelay: Infinity
    });
    stderrRl.on('line', (line) => {
        if (/Caused by:/.test(line)) {
            $('#shell_info').append('<p style="color: red;">' + line + '<p>');
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
    const stdoutRl = readline.createInterface({
        input: java.stdout,
        crlfDelay: Infinity
    });
    stdoutRl.on('line', (line) => {
        if (/Caused by:/.test(line)) {
            $('#shell_info').append('<p style="color: red;">' + line + '<p>');
        } else $('#shell_info').append('<p>' + line + '</p>');
    });
    const stderrRl = readline.createInterface({
        input: java.stderr,
        crlfDelay: Infinity
    });
    stderrRl.on('line', (line) => {
        if (/Caused by:/.test(line)) {
            $('#shell_info').append('<p style="color: red;">' + line + '<p>');
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
    $('#blog_check_result').css('display', 'none');
    $('#blog_check_error').css('display', 'none');
    let java = spawn("java", ["-jar", "ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar", "-c", "blogthread"], { cwd: ingentia_path });
    java.stdout.setEncoding("ASCII");
    const stdoutRl = readline.createInterface({
        input: java.stdout,
        crlfDelay: Infinity
    });
    stdoutRl.on('line', (line) => {
        if (/Caused by:/.test(line)) {
            $('#shell_info').append('<p style="color: red;">' + line + '<p>');
        } else $('#shell_info').append('<p>' + line + '</p>');
    });
    const stderrRl = readline.createInterface({
        input: java.stderr,
        crlfDelay: Infinity
    });
    stderrRl.on('line', (line) => {
        if (/Caused by:/.test(line)) {
            $('#shell_info').append('<p style="color: red;">' + line + '<p>');
        }
    });
    java.on('error', (err) => {
        console.error(`错误 ${err} 发生`);
    });
    java.on('exit', (code, signal) => {
        console.log(`子进程收到信号 ${signal} 而终止`);
        $('#shell_info').append("<p>------------------------------</p>");
        if (code == 0) {
            callback()
            console.log(`子进程退出码：${code}`);
        } else {
            console.log(`子进程退出码：${code}`);
            console.log("------------------------------");
            $('#shell_info').append("<p>Blog 测试中止</p>");
        }
        $("#blog_stop_button").off("click", "**")
        $('#blog_stop_button').css("display", "none")
    });
    const fs_watch = fs.watch(path.join(ingentia_path, "logs"), (eventType, filename) => {
        console.log(`事件类型是: ${eventType}`);
        if (filename == 'transformed.log') {
            if (eventType == 'rename') {
                if (fs.existsSync(path.join(ingentia_path, "logs", filename))) {
                    //生成HTML
                    $('#blog_check_result').css('display', 'inline-block');
                }
            }
            console.log(`提供的文件名: ${filename}`);
        } else if (filename == 'errors.log') {
            if (eventType == 'rename') {
                if (fs.existsSync(path.join(ingentia_path, "logs", filename))) {
                    //查看错误信息
                    $('#blog_check_error').css('display', 'inline-block');
                }
            }
        } else if (filename) {} else console.log('文件名不存在');
    });
    $('#blog_stop_button').css("display", "inline-block");
    $('#blog_stop_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        java.kill()
        fs_watch.close()
    });
}

/*生成finished.xml*/
function url_run(callback) {
    // console.log('runUrl');
    $('#shell_info').empty();
    jsonParser.parseString(fs.readFileSync(path.join(confData.finish, 'SubSourceCrawlerConfig.xml')), function(err, result) {
        // console.log(result.SubSourceCrawlerConfig)
        $('#shell_info').append('<p>正在运行 <strong>' + result.SubSourceCrawlerConfig.SourceName + '</strong> URL，请稍等，日志延迟显示！</p>');
        let py = spawn("python", [path.join(Tmonkey_path, 'tmonkey.py'), "sc"], {
            shell: true
        });
        py.stdout.setEncoding("ASCII");
        const stdoutRl = readline.createInterface({
            input: py.stdout,
            crlfDelay: Infinity
        });
        stdoutRl.on('line', (line) => {
            $('#shell_info').append('<p>' + line + '</p>');
        });
        const stderrRl = readline.createInterface({
            input: py.stderr,
            crlfDelay: Infinity
        });
        stderrRl.on('line', (line) => {
            $('#shell_info').append('<p style="color: red;">' + line + '<p>');
        });
        py.on('error', (err) => {
            console.error(`错误 ${err} 发生`);
        });
        py.on('exit', (code, signal) => {
            console.log(`子进程收到信号 ${signal} 而终止`);
            if (code == 0) {
                callback(result.SubSourceCrawlerConfig.SourceName)
                console.log(`子进程退出码：${code}`);
            } else {
                $('#shell_info').append('<p style="color: red;">进程中止！</p>')
                console.log(`子进程退出码：${code}`);
                console.log("------------------------------");
            }
            $("#forum_stop_button").off("click", "**")
            $('#forum_stop_button').css("display", "none")
        });
        $('#forum_stop_button').css("display", "inline-block");
        $('#forum_stop_button').on('click', function(event) {
            event.preventDefault();
            /* Act on the event */
            py.kill('SIGKILL')
        });
    })
}

/*生成finished.xml*/
function forum_run(source_path, callback) {
    console.log('runForum');
    $('#shell_info').empty();
    $('#shell_info').append('<p>正在运行<strong>' + path.basename(source_path) + '</strong>，请稍等，日志延迟显示！</p>');
    fs.watch(path.join(forumtest_path, "temp", path.basename(source_path)), (eventType, filename) => {
        console.log(`事件类型是: ${eventType}`);
        if (filename == 'transformed.log') {
            if (eventType == 'rename') {
                if (fs.existsSync(path.join(ingentia_path, "logs", filename))) {
                    //生成HTML
                    $('#forum_check_result').css('display', 'inline-block');
                }
            }
            console.log(`提供的文件名: ${filename}`);
        } else if (filename == 'errors.log') {
            if (eventType == 'rename') {
                if (fs.existsSync(path.join(ingentia_path, "logs", filename))) {
                    //查看错误信息
                    $('#forum_check_error').css('display', 'inline-block');
                }
            }
        } else if (filename) {
            console.log(filename)
        } else console.log('文件名不存在');
    });
}

/*查看Forum 结果*/
function collect_forum(source_name, log_type) {
    let baseUrl = path.join(root_path, 'environment/temp', source_name);
    let log_path = path.join(confData.source, "../", "temp", log_type + '.log')
    //读取文件目录
    fs.readdir(baseUrl, function(err, files) {
        if (err) {
            console.error(err);
            return;
        }
        if (!fs.existsSync(path.join(log_path, '../'))) {
            fs.mkdirSync(path.join(log_path, '../'));
        }
        if (fs.existsSync(log_path)) { fs.unlinkSync(log_path); }
        files.forEach(function(filename, index, array) {
            let currentfile = path.join(baseUrl, filename, 'logs', log_type + '.log');
            if (fs.existsSync(currentfile)) {
                fs.stat(currentfile, function(err, stats) {
                    if (err) throw err;
                    if (stats.isFile()) {
                        // console.log(index,currentfile);
                        fs.readFile(currentfile, (err, data) => {
                            if (err) throw err;
                            fs.appendFileSync(log_path, data)
                        });
                    } else if (stats.isDirectory()) {
                        return false;
                    }
                });
            }
        });
        let newwindow = new BrowserWindow({
            width: 800,
            height: 600
        })
        if (log_type == 'transformed') {
            newwindow.loadURL(url.format({
                pathname: path.join(root_path, 'forum_transformed.html'),
                protocol: 'file:',
                slashes: true
            }))
        } else {
            newwindow.loadURL(url.format({
                pathname: path.join(root_path, 'forum_error.html'),
                protocol: 'file:',
                slashes: true
            }))
        }
        newwindow.on("closed", function() {
            newwindow = null
        })
    });
}

/*遍历目录*/
function readDirSync(path) {
    var pa = fs.readdirSync(path);
    pa.forEach(function(ele, index) {
        var info = fs.statSync(path + "/" + ele)
        if (info.isDirectory()) {
            console.log("dir: " + ele)
            readDirSync(path + "/" + ele);
        } else {
            console.log("file: " + ele)
        }
    })
}