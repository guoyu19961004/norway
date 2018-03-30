/*
 * @Author: Administrator
 * @Date:   2017-11-23 18:09:20
 * @Last Modified by:   Administrator
 * @Last Modified time: 2018-03-30 15:26:50
 */
const electron = require('electron')
const fs = require('fs')
const xml2js = require('xml2js')
const path = require('path')
const url = require('url')
const { remote } = require('electron')
const { Menu, MenuItem, dialog } = remote
const BrowserWindow = remote.BrowserWindow
const { exec, spawn } = require('child_process')
const readline = require('readline')
const forum = require('./forum.js')


const menu = new Menu()
const window_menuIteam = new MenuItem({
    label: "窗口",
    submenu: [{
        label: "重新加载",
        role: "reload"
    }, {
        label: "重新加载忽略缓存",
        role: "forcereload"
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
menu.append(new MenuItem({
    label: "设置",
    click() {
        openSettings()
    }
}))
menu.append(window_menuIteam)
menu.append(new MenuItem({
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
}))
menu.append(new MenuItem({
    label: "开发者工具",
    role: "toggledevtools"
}))
menu.append(new MenuItem({
    label: "退出",
    role: "quit"
}))
window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    menu.popup(remote.getCurrentWindow())
}, false)

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

const ingentia_path = path.join(__dirname, '../environment/ingentia-run')
const resource_path = path.join(__dirname, '../resources')
const root_path = path.join(__dirname, '../')

const pids = []
judge_settings()

$(document).ready(function() {
    //初始化
    $('ul.tabs').tabs();
    $('select').material_select();
    if (fs.existsSync(path.join(ingentia_path, 'logs/transformed.log'))) {
        $('#blog_check_result').css('display', 'inline-block');
    }
    if (fs.existsSync(path.join(ingentia_path, "logs/errors.log"))) {
        $('#blog_check_error').css('display', 'inline-block');
    }
    /*根据sourceID获取source按钮事件*/
    $('#get_source_id').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        let source_id = $('#source_id').val()
        if (/^\d+$/.test(source_id)) {
            $('#shell_info').empty()
            get_source_content(window.localStorage, source_id)
        } else alert('请输入正确的Source ID！')
    });
    /*访问目录获取source路劲按钮事件*/
    $('#get_source_by_path').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        dialog.showOpenDialog({
            title: '选择Source',
            properties: ['openDirectory']
        }, function(filePaths) {
            if (filePaths) {
                if (fs.existsSync(path.join(filePaths[0], 'globalConfig.xml'))) {
                    console.log(judge_blog_type(filePaths[0]));
                    $('#source_type').text(judge_blog_type(filePaths[0]))
                    $('ul.tabs').tabs('select_tab', 'blog-wrap')
                    $('#shell_info').empty()
                } else {
                    $('#source_type').text('FORUM')
                    $('ul.tabs').tabs('select_tab', 'forum-wrap')
                    $('#shell_info').empty()
                }
                $('#source_name').text(path.basename(filePaths[0]))
                $('#source_path').text(filePaths[0])
            }
        })
    });
    /*下载链接按钮点击事件*/
    $('#downloadForm').validate({
        rules: {
            link: {
                required: true,
                url: true
            },
            encoding: "required",
            download_type: "required",
        },
        messages: {
            link: {
                required: "请输入下载网址"
            },
            encoding: "请选择网页编码",
            download_type: "请选择下载类型"
        },
        submitHandler: function(form) {
            let type = form.download_type.value
            console.log(type)
            download_url(form.link.value, form.encoding.value, function() {
                $('#shell_info').append("<p>------------------------------</p>");
                let source_save_path = '';
                if ($('#source_path').text() != '') {
                    if (type == 'blog') {
                        source_save_path = path.join($('#source_path').text(), '../..', 'download.xml')
                    } else if (type == 'thread') {
                        source_save_path = path.join($('#source_path').text(), '../..', 'thread-download.xml')
                    } else source_save_path = path.join($('#source_path').text(), '../..', 'url-download.xml')
                    $('#download_save_path').text(source_save_path)
                    link_file(path.join(ingentia_path, 'logs/cleanedump.log'), source_save_path)
                } else if (window.localStorage.source != '') {
                    if (type == 'blog') {
                        source_save_path = path.join(window.localStorage.source, '../..', 'download.xml')
                    } else if (type == 'thread') {
                        source_save_path = path.join(window.localStorage.source, '../..', 'thread-download.xml')
                    } else source_save_path = path.join(window.localStorage.source, '../..', 'url-download.xml')
                    $('#download_save_path').text(source_save_path)
                    link_file(path.join(ingentia_path, 'logs/cleanedump.log'), source_save_path)
                } else {
                    dialog.showOpenDialog({
                        title: '选择Download存放目录',
                        properties: ['openDirectory']
                    }, function(filePaths) {
                        if (filePaths) {
                            if (type == 'blog') {
                                source_save_path = path.join(filePaths[0], '../..', 'download.xml')
                            } else if (type == 'thread') {
                                source_save_path = path.join(filePaths[0], '../..', 'thread-download.xml')
                            } else source_save_path = path.join(filePaths[0], '../..', 'url-download.xml')
                            $('#download_save_path').text(source_save_path)
                            link_file(path.join(ingentia_path, 'logs/cleanedump.log'), source_save_path)
                        }
                    })
                }
            })
            if (form.download_type == 'blog') {

            }
        },
        errorElement: 'em'
    });
    $('#blog_run_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        if ($('#source_path').text()) {
            const source_save_path = $('#source_path').text()
            if (fs.existsSync(path.join(source_save_path, 'globalConfig.xml'))) {
                $('#source_type').text(judge_blog_type(source_save_path))
                $('#source_name').text(path.basename(source_save_path))
                $('#source_path').text(source_save_path)
                link_blog_file(source_save_path)
                blog_run(function() {
                    console.log('________________________');
                })
            } else {
                alert('请选择一个Blog Source！');
            }
        } else {
            dialog.showOpenDialog({
                title: '选择Source',
                properties: ['openDirectory']
            }, function(filePaths) {
                if (filePaths) {
                    if (fs.existsSync(path.join(filePaths[0], 'globalConfig.xml'))) {
                        $('#source_type').text(judge_blog_type(filePaths[0]))
                        $('#source_name').text(path.basename(filePaths[0]))
                        $('#source_path').text(filePaths[0])
                        link_blog_file(filePaths[0])
                        blog_run(function() {
                            console.log('________________________');
                        })
                    } else {
                        alert('请选择一个Blog Source！');
                    }
                }
            })
        }
    });
    $('#blog_check_result').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        let newwindow = new BrowserWindow({
            width: 800,
            height: 600
        })
        newwindow.loadURL(url.format({
            pathname: path.join(root_path, 'blog_transformed.html'),
            protocol: 'file:',
            slashes: true
        }))
        newwindow.on("closed", function() {
            newwindow = null
        })
    });
    $('#blog_check_error').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        let newwindow = new BrowserWindow({
            width: 800,
            height: 600
        })
        newwindow.loadURL(url.format({
            pathname: path.join(root_path, 'blog_error.html'),
            protocol: 'file:',
            slashes: true
        }))
        newwindow.on("closed", function() {
            newwindow = null
        })
    });
    $('#url_run_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        $('#shell_info').empty()
        if ($('#source_path').text()) {
            $('#shell_info').append('<p>=================start===================</p>')
            if (fs.existsSync(path.join($('#source_path').text(), 'SubSourceCrawlerConfig.xml'))) {
                forum.Url.run(path.join($('#source_path').text(), 'SubSourceCrawlerConfig.xml'), (msg) => {
                    // console.log(msg);
                    $('#shell_info').append('<p>' + msg + '</p>')
                })
            } else {
                alert('请选择一个FORUM Source!');
            }
        } else {
            dialog.showOpenDialog({
                title: '选择Source',
                properties: ['openDirectory']
            }, function(filePaths) {
                if (filePaths) {
                    if (fs.existsSync(path.join(filePaths[0], 'SubSourceCrawlerConfig.xml'))) {
                        $('#source_type').text('FORUM')
                        $('#source_name').text(path.basename(filePaths[0]))
                        $('#source_path').text(filePaths[0])
                        $('#shell_info').append('<p>=================start===================</p>')
                        forum.Url.run(path.join(filePaths[0], 'SubSourceCrawlerConfig.xml'), (msg) => {
                            // console.log(msg);
                            $('#shell_info').append('<p>' + msg + '</p>')
                        })
                    } else {
                        alert('SubSourceCrawlerConfig.xml 不存在！')
                    }
                }
            })
        }
    });
    $('#forum_run_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        $('#shell_info').empty()
        $('#forum_check_result').css('display', 'none')
        $('#forum_check_error').css('display', 'none')
        const temp_source_dir = path.join(root_path, 'environment/temp')
        if (!fs.existsSync(temp_source_dir)) fs.mkdirSync(temp_source_dir)
        const fs_watch = fs.watch(temp_source_dir, { recursive: true }, (eventType, filename) => {
            if (eventType == 'rename') {
                if (/transformed\.log$/g.test(filename)) {
                    if (fs.existsSync(path.join(temp_source_dir, filename))) {
                        $('#forum_check_result').css('display', 'inline-block')
                    }
                } else if (/errors\.log$/g.test(filename)) {
                    if (fs.existsSync(path.join(temp_source_dir, filename))) {
                        $('#forum_check_error').css('display', 'inline-block')
                    }
                }
            } else if (filename) {} else {
                console.log('未提供文件名')
            }
        })
        console.log(pids)
        if ($('#source_path').text()) {
            const source_save_path = $('#source_path').text()
            if (fs.existsSync(path.join(source_save_path, 'SubSourceCrawlerConfig.xml'))) {
                $('#source_type').text('FORUM')
                $('#source_name').text(path.basename(source_save_path))
                $('#source_path').text(source_save_path)
                forum.Subforum.run(source_save_path, pids, (msg) => {
                    // console.log(msg);
                    $('#shell_info').append('<p>' + msg + '</p>')
                })
                console.log(pids)
                $('#forum_stop_button').css("display", "inline-block")
                $('#forum_stop_button').on('click', function(event) {
                    event.preventDefault()
                    /* Act on the event */
                    $('#forum_stop_button').css("display", "none")
                    while (pids.length > 0) {
                        process.kill(pids.shift())
                    }
                    fs_watch.close()
                    $('#shell_info').append('<p>===================================</p>')
                    $('#shell_info').append('<p>SubForum 停止测试！</p>')
                })
            } else {
                alert('SubSourceCrawlerConfig.xml 不存在！')
            }
        } else {
            dialog.showOpenDialog({
                title: '选择Source',
                properties: ['openDirectory']
            }, function(filePaths) {
                if (filePaths) {
                    if (fs.existsSync(path.join(filePaths[0], 'SubSourceCrawlerConfig.xml'))) {
                        $('#source_type').text('FORUM')
                        $('#source_name').text(path.basename(filePaths[0]))
                        $('#source_path').text(filePaths[0])
                        forum.Subforum.run(filePaths[0], pids, (msg) => {
                            // console.log(msg);
                            $('#shell_info').append('<p>' + msg + '</p>')
                        })
                        console.log(pids)
                        $('#forum_stop_button').css("display", "inline-block")
                        $('#forum_stop_button').on('click', function(event) {
                            event.preventDefault()
                            /* Act on the event */
                            $('#forum_stop_button').css("display", "none")
                            while (pids.length > 0) {
                                process.kill(pids.shift())
                            }
                            fs_watch.close()
                            $('#shell_info').append('<p>===================================</p>')
                            $('#shell_info').append('<p>SubForum 停止测试！</p>')
                        })
                    } else {
                        alert('SubSourceCrawlerConfig.xml 不存在！')
                    }
                }
            })
        }
    });
    $('#forum_check_result').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        if ($('#source_path').text()) {
            let source_save_path = $('#source_path').text()
            collect_forum(path.basename(source_save_path), 'transformed')
        } else {
            dialog.showOpenDialog({
                title: '选择Source',
                properties: ['openDirectory']
            }, function(filePaths) {
                if (filePaths) {
                    if (fs.existsSync(path.join(filePaths[0], 'globalConfig.xml'))) {
                        alert('请选择一个Forum Source！');
                    } else {
                        $('#source_type').text('FORUM')
                        $('#source_name').text(path.basename(filePaths[0]))
                        $('#source_path').text(filePaths[0])
                        collect_forum(path.basename(filePaths[0]), 'transformed')
                    }
                }
            })
        }
    });
    $('#forum_check_error').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        if ($('#source_path').text()) {
            let source_save_path = $('#source_path').text()
            collect_forum(path.basename(source_save_path), 'errors')
        } else {
            dialog.showOpenDialog({
                title: '选择Source',
                properties: ['openDirectory']
            }, function(filePaths) {
                if (filePaths) {
                    if (fs.existsSync(path.join(filePaths[0], 'globalConfig.xml'))) {
                        alert('请选择一个Forum Source！');
                    } else {
                        $('#source_type').text('FORUM')
                        $('#source_name').text(path.basename(filePaths[0]))
                        $('#source_path').text(filePaths[0])
                        collect_forum(path.basename(filePaths[0]), 'errors')
                    }
                }
            })
        }
    });
});

//判断设置的配置文件是否存在
function judge_settings() {
    console.log(resource_path)
    if (judge_local_storage()) {
        get_source_info(window.localStorage)
    } else {
        openSettings()
    }
}

function judge_local_storage() {
    if ($.isEmptyObject(window.localStorage)) return false
    else if (!window.localStorage.length) return false
    else if (!window.localStorage.username) return false
    else if (!window.localStorage.password) return false
    else if (!window.localStorage.source) return false
    else if (!window.localStorage.host) return false
    else return true

}
//保存settings
function saveConf(argument) {
    window.localStorage.username = argument.username
    window.localStorage.password = argument.password
    window.localStorage.source = argument.source
    window.localStorage.host = argument.host
    window.localStorage.finish = argument.finish
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
    // newwindow.setMenu(null)
    newwindow.on("closed", function() {
        if (judge_local_storage()) {
            get_source_info(window.localStorage)
        } else {
            openSettings()
        }
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
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            Materialize.toast(textStatus, 2000)
        },
        success: function(msg) {
            $.ajax({
                type: "GET",
                url: path.join(argument.host, 'api/outsource/source/'),
                dataType: 'json',
                error: function(XMLHttpRequest, textStatus, errorThrown) {
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


//根据sourceid拿到对应source的JSON对象
function get_source_by_id(argument, source_id) {
    console.log('get_source_by_id')
    const source = {
        source_id: '',
        source_name: '',
        type: ''
    }
    $.each(argument, function(index, val) {
        /* iterate through array or object */
        if (val.source_id == source_id) {
            source.source_id = val.source_id
            window.localStorage.source_id = val.source_id
            source.source_name = val.source_name
            window.localStorage.source_name = val.source_name
            $('#source_name').text(val.source_name)
            source.type = val.type
            window.localStorage.type = val.type
            $('#source_type').text(val.type)
            if (val.type == 'BLOG') $('ul.tabs').tabs('select_tab', 'blog-wrap')
            else $('ul.tabs').tabs('select_tab', 'forum-wrap')
        }
    })
    return source
}

/*获取sources.xml*/
function get_source_content(argument, source_id) {
    console.log('get_source_content')
    //判断设置的配置文件是否存在
    if (fs.existsSync(path.join(resource_path, 'sources.xml'))) {
        //读取sources.xml
        let conf = fs.readFileSync(path.join(resource_path, 'sources.xml'));
        if (conf) {
            jsonParser.parseString(conf, function(err, result) {
                let source_obj = get_source_by_id(result.norway.source, source_id)
                $.ajax({
                    type: "POST",
                    url: argument.host,
                    data: {
                        username: argument.username,
                        password: argument.password,
                        login: 'Login'
                    },
                    success: function(msg) {
                        if ($.isEmptyObject(source_obj)) {
                            $.get(path.join(argument.host, 'api/outsource/source/'), function(sources) {
                                source_obj = get_source_by_id(sources, source_id)
                                const source = {
                                    source: sources
                                }
                                if (!checkDirExist(resource_path)) fs.mkdirSync(resource_path)
                                const xml = jsonBuilder.buildObject(source)
                                fs.writeFileSync(path.join(resource_path, 'sources.xml'), xml)
                                console.log('xml done')
                            }, 'json')
                        }
                        /*下载source内容*/
                        console.log(source_obj)
                        download_source(source_obj, argument.host)
                    }
                })
            })
        } else {
            alert('sources.xml为空! 开始更新！')
            get_source_info(window.localStorage)
        }
    } else {
        alert('更新sources数量中，请稍后重新下载！')
        get_source_info(window.localStorage)
    }
}

/*下载source内容*/
function download_source(source_obj, host_url) {
    if ($.isEmptyObject(source_obj)) {
        alert('source id 不存在！')
    } else {
        console.log('download_source')
        if (!checkDirExist(window.localStorage.source)) {
            fs.mkdirSync(window.localStorage.source)
        }
        if (source_obj.type == "FORUM") {
            /*论坛*/
            download_forum_file(path.join(host_url, 'api/source/submit/file/'), source_obj, window.localStorage.source)
        } else {
            download_blog_file(path.join(host_url, 'api/source/submit/file/'), source_obj, window.localStorage.source)
        }
    }
}

/*下载*/
function download(url, source_id, filename, savefile) {
    $.ajax({
        type: "GET",
        url: url,
        data: {
            "source_id": source_id,
            "filename": filename
        },
        cache: false,
        success: function(response, statusMessage) {
            // console.log(response)
            if (response != null) {
                const ws = fs.createWriteStream(savefile)
                let buf
                if (new RegExp(/config$/).test(filename)) {
                    jsonParser.parseString(response, function(err, result) {
                        buf = new xml2js.Builder({
                            renderOpts: {
                                pretty: true,
                                indent: '    '
                            },
                            xmldec: {
                                'version': '1.0'
                            }
                        }).buildObject(result)
                        if (filename == 'global_config') {
                            let whetherJs = result['no.integrasco.ingentia.news.config.BlogNewsGlobalCustomCrawlerConfig'].javaScriptTransform
                            if (result['no.integrasco.ingentia.news.config.BlogNewsGlobalCustomCrawlerConfig'].javaScriptTransform == 'true') {
                                $('#source_type').text('JS BLOG')
                            }
                        }
                    })
                } else buf = Buffer.from(response)
                ws.write(buf, 'utf8')
                ws.end()
                ws.on('close', function(err) {
                    if (!err) {
                        Materialize.toast(filename + '下载完毕', 2000)
                    } else {
                        console.log(err)
                    }
                })
            } else {
                alert("服务器繁忙！")
            }
        }
    })
}

/*下载blog所需文件*/
function download_blog_file(url, source_obj, source_path) {
    let source_name = ''
    source_name = source_obj.source_name
    let single_source_path = path.join(source_path, source_name)
    if (!checkDirExist(single_source_path)) fs.mkdirSync(single_source_path)
    download(url, source_obj.source_id, "global_config", path.join(single_source_path, 'globalConfig.xml'))
    download(url, source_obj.source_id, "config", path.join(single_source_path, 'config.xml'))
    download(url, source_obj.source_id, "subconfig", path.join(single_source_path, 'subSourceConfig.xml'))
    download(url, source_obj.source_id, "transformation", path.join(single_source_path, 'TestTransformation.xq'))
    $('#source_path').text(single_source_path)
}

/*下载blog所需文件*/
function download_forum_file(url, source_obj, source_path) {
    let source_name = ''
    source_name = source_obj.source_name
    let single_source_path = path.join(source_path, source_obj.source_name)
    if (!checkDirExist(single_source_path)) fs.mkdirSync(single_source_path)
    download(url, source_obj.source_id, "thread_transformation", path.join(single_source_path, source_name + '-thread.xq'))
    download(url, source_obj.source_id, "url_transformation", path.join(single_source_path, source_name + '-url.xq'))
    download(url, source_obj.source_id, "config", path.join(single_source_path, 'webForumConfiguration.xml'))
    $('#source_path').text(single_source_path)
}

/*链接BLOG source file*/
function link_blog_file(source_save_path) {
    link_file(path.join(source_save_path, "config.xml"), path.join(ingentia_path, "conf/configuration/config.xml"))
    link_file(path.join(source_save_path, "globalConfig.xml"), path.join(ingentia_path, "conf/configuration/globalConfig.xml"))
    link_file(path.join(source_save_path, "subSourceConfig.xml"), path.join(ingentia_path, "conf/configuration/subSourceConfig.xml"))
    link_file(path.join(source_save_path, "TestTransformation.xq"), path.join(ingentia_path, "conf/transformation/TestTransformation.xq"))
}

/*链接source文件*/
function link_file(existingPath, newPath) {
    if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath)
    }
    fs.linkSync(existingPath, newPath)
}

/*判断是否JS BLOG*/
function judge_blog_type(source_path) {
    let global_config = fs.readFileSync(path.join(source_path, 'globalConfig.xml'))
    let type = 'BLOG'
    if (global_config) {
        jsonParser.parseString(global_config, function(err, result) {
            let whetherJs = result['no.integrasco.ingentia.news.config.BlogNewsGlobalCustomCrawlerConfig'].javaScriptTransform
            if (whetherJs == 'true') {
                type = 'JS BLOG'
            }
        });
    } else {
        alert('globalConfig.xml为空!');
    }
    return type
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
        if (filename == 'transformed.log') {
            if (eventType == 'rename') {
                if (fs.existsSync(path.join(ingentia_path, "logs", filename))) {
                    //生成HTML
                    $('#blog_check_result').css('display', 'inline-block');
                }
            }
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

/*查看Forum 结果*/
function collect_forum(source_name, log_type) {
    let baseUrl = path.join(root_path, 'environment/temp', source_name);
    let log_path = path.join(window.localStorage.source, "../", "temp", log_type + '.log')
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