/*
 * @Author: Administrator
 * @Date:   2017-11-23 18:09:20
 * @Last Modified by:   Administrator
 * @Last Modified time: 2018-03-09 22:58:14
 */
const electron = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')

const resource_path = path.join(__dirname, '../resources')
const root_path = path.join(__dirname, '../')

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
        newwindow.on("closed", function() {
            newwindow = null
        })
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

judge_settings()

$(document).ready(function() {
    //初始化
    $('ul.tabs').tabs();
    $('select').material_select();
    if (fs.existsSync(path.join(ingentia_path, 'logs/transformed.log'))) {
        $('#check_result').css('display', 'inline-block');
    }
    if (fs.existsSync(path.join(ingentia_path, "logs/errors.log"))) {
        $('#check_error').css('display', 'inline-block');
    }
    /*根据sourceID获取source按钮事件*/
    $('#get_source_id').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        let source_id = $('#source_id').val()
        if (/^\d+$/.test(source_id)){
            get_source_content(confData, source_id)
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
                } else {
                    $('#source_type').text('FORUM')
                    $('ul.tabs').tabs('select_tab', 'forum-wrap')
                }
                $('#source_name').text(path.basename(filePaths[0]))
                $('#source_path').text(filePaths[0])
            }
        })
    });
    /*下载链接按钮点击事件*/
    $('#download_link_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        let download_link = $('#download_link').val()
        let web_encoding = $("#web_encoding").val()
        if (IsURL(download_link)) {
            let cli = 'java -jar ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar -c clean tagsoup ' + download_link + ' ' + web_encoding
            let PythonCli = 'python ' + path.join(Tmonkey_path, 'tmonkey.py') + ' sc'
            // console.log(`This platform is ${process.platform}`)
            /*JAVA下载链接*/
            download_url(download_link, web_encoding, function() {
                $('#shell_info').append("<p>------------------------------</p>");
                let source_save_path = '';
                if ($('#source_path').text() != '') {
                    source_save_path = path.join($('#source_path').text(), '../..', 'download.xml')
                    $('#download_save_path').text(source_save_path)
                    link_file(path.join(ingentia_path, 'logs/cleanedump.log'), source_save_path)
                } else if (confData.source != '') {
                    source_save_path = path.join(confData.source, '../', 'download.xml')
                    $('#download_save_path').text(source_save_path)
                    link_file(path.join(ingentia_path, 'logs/cleanedump.log'), source_save_path)
                } else {
                    dialog.showOpenDialog({
                        title: '选择Download存放目录',
                        properties: ['openDirectory']
                    }, function(filePaths) {
                        if (filePaths) {
                            source_save_path = path.join(filePaths[0], 'download.xml')
                            $('#download_save_path').text(source_save_path)
                            link_file(path.join(ingentia_path, 'logs/cleanedump.log'), source_save_path)
                        }
                    })
                }
            })
        } else alert('请输入正确的网页下载链接！')
    });
    $('#blog_run_button').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        if ($('#source_path').text()) {
            let source_save_path = $('#source_path').text()
            link_blog_file(source_save_path)
            blog_run(function() {
                console.log('________________________');
            })
        } else {
            dialog.showOpenDialog({
                title: '选择Source',
                properties: ['openDirectory']
            }, function(filePaths) {
                if (filePaths) {
                    if (fs.existsSync(path.join(filePaths[0], 'globalConfig.xml'))) {
                        $('#source_type').text(judge_blog_type(filePaths[0]))
                        link_blog_file(filePaths[0])
                        blog_run(function() {
                            console.log('________________________');
                        })
                    } else {
                        alert('请选择一个Blog Source！');
                    }
                    $('#source_name').text(path.basename(filePaths[0]))
                    $('#source_path').text(filePaths[0])
                }
            })
        }
    });
    $('#check_result').on('click', function(event) {
        event.preventDefault();
        /* Act on the event */
        let newwindow = new BrowserWindow({
            width: 800,
            height: 600
        })
        newwindow.loadURL(url.format({
            pathname: path.join(root_path, 'transformed.html'),
            protocol: 'file:',
            slashes: true
        }))
        newwindow.on("closed", function() {
            newwindow = null
        })
    });
});


//判断设置的配置文件是否存在
function judge_settings() {
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
        let newwindow = new BrowserWindow({
            width: 500,
            height: 400,
            resizable: false
        })
        newwindow.loadURL(url.format({
            pathname: path.join(root_path, 'settings.html'),
            protocol: 'file:',
            slashes: true
        }))
        newwindow.on("closed", function() {
            newwindow = null
        })
    }
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
        success: function(msg) {
            $.get(path.join(argument.host, 'api/outsource/source/'), function(sources) {
                let xml = ''
                let source = {
                    source: sources
                }
                if (!checkDirExist(resource_path)) fs.mkdirSync(resource_path)
                xml = jsonBuilder.buildObject(source)
                fs.writeFileSync(path.join(resource_path, 'sources.xml'), xml)
                Materialize.toast('Sources 数量更新完毕！', 3000)
            }, 'json')
        }
    })
}

//保存settings
function saveConf(argument) {
    confData.username = argument.username
    confData.password = argument.password
    confData.source = argument.source
    confData.host = argument.host
    confData.finish = argument.finish
}

//根据sourceid拿到对应source的JSON对象
function get_source_by_id(argument, source_id, source) {
    console.log('get_source_by_id')
    $.each(argument, function(index, val) {
        /* iterate through array or object */
        if (val.source_id == source_id) {
            source.source_id = val.source_id
            global_souce_data.source_id = val.source_id
            source.source_name = val.source_name
            global_souce_data.source_name = val.source_name
            $('#source_name').text(val.source_name)
            source.type = val.type
            global_souce_data.type = val.type
            $('#source_type').text(val.type)
            if (val.type == 'BLOG') $('ul.tabs').tabs('select_tab', 'blog-wrap')
            else $('ul.tabs').tabs('select_tab', 'forum-wrap')
        }
    });
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
                let source_obj = {}
                get_source_by_id(result.norway.source, source_id, source_obj)
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
                                get_source_by_id(sources, source_id, source_obj)
                                let xml = ''
                                let source = {
                                    source: sources
                                }
                                if (!checkDirExist(resource_path)) fs.mkdirSync(resource_path)
                                xml = jsonBuilder.buildObject(source)
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
            alert('sources.xml为空!')
        }
    } else {
        alert('更新sources数量中，请稍后重新下载！')
        get_source_info(confData)
    }
}

/*下载source内容*/
function download_source(source_obj, host_url) {
    if($.isEmptyObject(source_obj)) {
        alert('source id 不存在！')
    } else {
        console.log('download_source')
        if (!checkDirExist(confData.source)) {
            fs.mkdirSync(confData.source)
        }
        if (source_obj.type == "FORUM") {
            /*论坛*/
            download_forum_file(path.join(host_url, 'api/source/submit/file/'), source_obj, confData.source)
        } else {
            download_blog_file(path.join(host_url, 'api/source/submit/file/'), source_obj, confData.source)
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