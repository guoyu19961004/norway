/*
 * @Author: Administrator
 * @Date:   2018-03-22 10:53:41
 * @Last Modified by:   guoyu19961004
 * @Last Modified time: 2018-03-28 11:16:09
 */
const fs = require('fs')
const path = require('path')
const util = require('util')
const xml2js = require('xml2js')
const cheerio = require('cheerio')
const { URL, URLSearchParams } = require('url')
const { exec, spawn, spawnSync } = require('child_process')
const readline = require('readline')

const root_path = path.join(__dirname, '../')

const jsonBuilder = new xml2js.Builder({
    rootName: 'sourceurls',
    renderOpts: {
        pretty: true,
        indent: '    '
    },
    xmldec: {
        'version': '1.0',
        'encoding': 'UTF-8'
    }
}) // jons -> xml

const SubSourceJsonBuilder = new xml2js.Builder({
    rootName: 'no.integrasco.immensus.storage.domain.source.SubSource',
    renderOpts: {
        pretty: true,
        indent: '    '
    },
    xmldec: {
        'version': '1.0',
        'encoding': 'UTF-8'
    }
}) // jons -> xml

const jsonParser = new xml2js.Parser({
    explicitArray: false //一个子节点直接访问不生成数组
})

/*生成打印信息*/
const print_msg = (msg) => {
    const date = new Date()
    const month = (date.getMonth() < 9) ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1).toString()
    const day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate().toString()
    const hour = (date.getHours() < 10) ? '0' + date.getHours() : date.getHours().toString()
    const minute = (date.getMinutes() < 10) ? '0' + date.getMinutes() : date.getMinutes().toString()
    const second = (date.getSeconds() < 10) ? '0' + date.getSeconds() : date.getSeconds().toString()
    return util.format('INFO: %d-%s-%s %s:%s:%s %s', date.getFullYear(), month, day, hour, minute, second, msg)
}

/*url_run*/
const url_run = () => {
    const ingentia_path = path.join(root_path, 'environment/ingentia-run')
    const link_dump_path = path.join(ingentia_path, 'logs/cleanedump.log')
    const visit_queue = []
    const visit_history = []
    const subsources = []
    const failed_subsources = []
    const sourceurl = {
        url: '',
        descriptions: [{
            description: ''
        }]
    }
    /*运行*/
    const run = (config_path, show_msg) => {
        const config = get_config(config_path, show_msg)
        // console.log(config)
        const first_url = {
            link: config['FirstUrl'],
            description: config['SourceName']
        }
        add_to_visit_queue(first_url)
        url_process(config, config_path, show_msg)
    }
    /*链接处理函数*/
    const url_process = (config, config_path, show_msg) => {
        if (visit_queue.length != 0) {
            /*选取并去除数组中的第一个*/
            const url = visit_queue.shift()
            const link = url.link
            const description = url.description
            let visit_link = link
            if (link == config['FirstUrl']) {
                visit_link = link
            } else {
                visit_link = append_parameters_to_url(link, config['VisitAddon'])
            }
            show_msg(print_msg(util.format('Visiting %s', visit_link)))
            visit_history.push(url)
            const download_obj = dump_page_ingentia(visit_link, config['InputEncoding'])
            download_obj.on('close', (code) => {
                if (code == 0) {
                    add_to_visit_queue(get_urls_from_dump(config))
                    if (match_filter(visit_link, convert_to_common_regular(config['SubsourceUriPattern']))) {
                        show_msg(print_msg(util.format('Transforming %s', visit_link)))
                        const url_info = is_subsource_valid(config['UrlTransformation'], link_dump_path, visit_link, 0)
                        if (url_info.status) {
                            url.link = append_parameters_to_url(url.link, config['UrlAddon'])
                            const sourceurl = build_sourceurl(url.link, config['SourceName'], url.description)
                            // console.log(result)
                            subsources.push({ sourceurl })
                        } else {
                            failed_subsources.push(url)
                        }
                        show_msg(print_msg(url_info.msg))
                    }
                    url_process(config, config_path, show_msg)
                } else {
                	console.log('page download error!')
                }
            });
        } else if (failed_subsources.length != 0) {
            /*选取并去除数组中的第一个*/
            const url = failed_subsources.shift()
            const link = url.link
            const description = url.description
            const visit_link = append_parameters_to_url(link, config['VisitAddon'])
            show_msg(print_msg(util.format('Validating %s', visit_link)))
            const download_obj = dump_page_ingentia(visit_link, config['InputEncoding'])
            download_obj.on('close', (code) => {
                if (code == 0) {
                    show_msg(print_msg(util.format('Transforming %s', visit_link)))
                    const url_info = is_subsource_valid(config['UrlTransformation'], link_dump_path, visit_link, 0)
                    if (url_info.status) {
                        url.link = append_parameters_to_url(url.link, config['UrlAddon'])
                        const sourceurl = build_sourceurl(url.link, config['SourceName'], url.description)
                        // console.log(result)
                        subsources.push({ sourceurl })
                    }
                    show_msg(print_msg(url_info.msg))
                    url_process(config, config_path, show_msg)
                }
            });
        } else {
            fs.writeFileSync(path.join(config_path, '../finished.xml'), jsonBuilder.buildObject(subsources))
            show_msg(print_msg('==============================================='))
            show_msg(print_msg('URL完成！finished.xml已保存至' + path.join(config_path, '../finished.xml')))
        }
    }
    /*获取CONFIG*/
    const get_config = (config_path, callback) => {
        if (fs.existsSync(config_path)) {
            //读取settings.xml
            const config = fs.readFileSync(config_path)
            if (config) {
                let config_obj
                jsonParser.parseString(config, function(err, result) {
                    config_obj = result.SubSourceCrawlerConfig
                })
                return config_obj
            } else {
                callback('文件为空') //传入参数表示SubSourceCrawlerConfig.xml是空的
                return
            }
        } else {
            callback('文件不存在') //传入参数表示SubSourceCrawlerConfig.xml不存在
            return
        }
    }
    /*添加访问链接*/
    const add_to_visit_queue = (urls) => {
        if (urls.length) {
            urls.forEach((currentValue, index) => {
                /*判断链接是否访问过*/
                if (visit_history.some((element) => {
                        return (currentValue.link === element.link)
                    })) {
                    // console.log('visited')
                } else if (visit_queue.some((element) => {
                        return (currentValue.link === element.link)
                    })) {
                    // console.log('visit_queue exists')
                } else {
                    visit_queue.push(currentValue)
                }
            })
        } else if (urls.length != 0) {
            if (visit_history.some((element) => {
                    return (urls.link === element.link)
                })) {
                // console.log('visited')
            } else if (visit_queue.some((element) => {
                    return (urls.link === element.link)
                })) {
                // console.log('visit_queue exists')
            } else {
                visit_queue.push(urls)
            }
        }
    }
    /*给链接后面添加参数*/
    const append_parameters_to_url = (url, parameter) => {
        if (parameter) {
            if (/\?/.test(parameter)) url = url + '&' + parameter
            else url = url + '?' + parameter
        }
        // return url.replace(/&amp;/g, '&')
        return url
    }
    /*通过dump_page_ingentia下载页面*/
    const dump_page_ingentia = (url, encoding) => {
        return spawn("java", ["-jar", "ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar", "-c", "clean", "tagsoup", url, encoding], {
            cwd: ingentia_path,
            shell: true
        });
    }
    /*测获取满足规则链接*/
    const get_urls_from_dump = (config) => {
        // const data = fs.readFileSync(link_dump_path)
        const $ = cheerio.load(fs.readFileSync(link_dump_path).toString())
        const converted_strings = convert_to_common_regular([config['UriPattern'], config['SubsourceUriPattern']])
        // const raw_urls = $('a[href]')
        const urls = []
        $('a[href]').each((index, elem) => {
            // console.log(elem)
            // console.log($(elem).text())
            if (!/^#/.test($(elem).attr('href'))) {
                let link
                if (config['BaseUrl']) {
                    link = get_relative_urls($(elem).attr('href'), config['RemoveParameters'].RemoveParameter, config['BaseUrl'])
                } else {
                    link = get_relative_urls($(elem).attr('href'), config['RemoveParameters'].RemoveParameter)
                }
                // const link = get_relative_urls(config['BaseUrl'], $(elem).attr('href'), config['RemoveParameters'].RemoveParameter)
                const description = $(elem).text().replace(/[\r\n\t]/g, "").replace(/(^\s*)|(\s*$)/g, ""); //去掉回车换行+左右空格
                if (filter_urls(link, converted_strings)) {
                    // console.dir($(elem))
                    urls.push({
                        link,
                        description
                    })
                }
            }
        })
        /*去重*/
        return unique(urls)
    }
    /*拼接相对链接并去除无关参数*/
    const get_relative_urls = (url, parameters, baseurl = 'http://127.0.0.1') => {
        // console.log(baseurl)
        const result = new URL(url, baseurl)
        /*删除多余参数*/
        parameters.forEach((currentValue, index) => {
            result.searchParams.delete(currentValue)
        })
        return result.href
    }
    /*判断链接是否满足subsource要求*/
    const match_filter = (url, expression) => {
        return new RegExp(expression).test(url)
    }
    /*判断链接是否符合格式*/
    const filter_urls = (url, expressions) => {
        return expressions.some((expression) => {
            // console.log(new RegExp(expression).test(url))
            return new RegExp(expression).test(url)
        })
    }
    /*转换正则*/
    const convert_to_common_regular = (strings) => {
        const converted_strings = []
        const pattern_maps = {
            '{integer}': '[0-9]+',
            '{string}': '[-A-Za-z_0-9.%]+',
            '{all}': '.*?'
        }
        if (typeof(strings) == 'object') {
            strings.forEach((string, index) => {
                string = string.replace(/\?/g, '\\?')
                string = string.replace(/\./g, '\\.')
                string = string.replace(/\$/g, '')
                for (let prop in pattern_maps) {
                    string = string.replace(new RegExp(prop, 'g'), pattern_maps[prop])
                }
                converted_strings.push(string + '$')
            })
            return converted_strings
        } else {
            strings = strings.replace(/\?/g, '\\?')
            strings = strings.replace(/\./g, '\\.')
            strings = strings.replace(/\$/g, '')
            for (let prop in pattern_maps) {
                strings = strings.replace(new RegExp(prop, 'g'), pattern_maps[prop])
            }
            return strings + '$'
        }
    }
    /*判断链接是否能被URL-XQ检查*/
    const is_subsource_valid = (xq_path_file, xml_root, document_uri, gmt = 0) => {
        const SAXON9HE_JAR_PATH = path.join(root_path, 'environment/saxon9he.jar')
        const java = spawnSync('java', ['-cp', SAXON9HE_JAR_PATH, 'net.sf.saxon.Query', '-s:' + xml_root, '-q:' + xq_path_file, 'documentUri="' + document_uri + '"', 'gmtOffset="' + gmt + '"'], {
            shell: true
        });
        const info = {
            status: true,
            msg: 'Subosurce OK!'
        }
        if (java.status == 0) {
            jsonParser.parseString(java.stdout, function(err, result) {
                // console.log(result.forum.threads)
                if (result.forum.threads) {
                    // console.log(result)
                } else {
                    info.status = false
                    info.msg = 'Transformation have errros'
                }
            })
        } else {
            info.status = false
            info.msg = java.stderr.toString()
        }
        return info
    }
    /*建立sourceurJSON*/
    const build_sourceurl = (url, source_name, description) => {
        return {
            url: url,
            descriptions: {
                description: source_name + ": " + description
            }
        }
    }
    /*数组去重*/
    const unique = (array) => {
        let res = []
        array.forEach((item) => {
            if (!res.some((elem) => {
                    return (item.link === elem.link)
                })) {
                res.push(item)
            }
        })
        /*去除链接中以.xml结尾的链接*/
        return res.filter(function(item, index) {
            return !/\.xml\/?$/g.test(item.link);
        });
    }
    return {
        run
    }
}

/*Subforum Run*/
const subforum_run = () => {
    const temp_dir = path.join(root_path, 'environment/temp')
    const ingentia_path = path.join(root_path, 'environment/ingentia-run')
    const SubSourceJson = {
        subsourceid: 1,
        name: '',
        uri: ''
    }
    const WebForumObj = {
        url: 5,
        thread: 6
    }
    const run = (source_dir, pids, show_msg, thread_number = 5) => {
        const urls = read_finished_xml(source_dir)
        prepare(source_dir)
        show_msg('Clearing all temp directories and result directories')
        // console.log(urls)
        if (urls.length != 0) {
            show_msg(util.format('There are %d subforums in this source.', urls.length))
            for (let i = 0; i < thread_number; i++) {
                const pid = thread_run(i, source_dir, pids, urls, show_msg)
                pids.push(pid)
            }
        } else {
            show_msg('Threre are no subforum in finished.xml, may be there are some wrong with the SubSourceCrawlerConfig.xml')
        }
    }
    /*准备工作*/
    const prepare = (source_dir) => {
        const temp_source_dir = path.join(temp_dir, path.basename(source_dir))
        if (!fs.existsSync(temp_dir)) fs.mkdirSync(temp_dir)
        if (fs.existsSync(temp_source_dir)) {
            fs.readdirSync(temp_source_dir).forEach((file) => {
                delete_dir(path.join(temp_source_dir, file))
            })
        } else fs.mkdirSync(temp_source_dir)
    }
    /*复制ingentia文件夹*/
    const copy_ingentia_resource = (source_dir, url) => {
        if (!fs.existsSync(temp_dir)) fs.mkdirSync(temp_dir)
        const source_name = path.basename(source_dir)
        if (!fs.existsSync(path.join(temp_dir, source_name))) fs.mkdirSync(path.join(temp_dir, source_name))
        const ingentia_temp = fs.mkdtempSync(path.join(temp_dir, source_name, 'ingentia-'))
        /*复制文件*/
        copy_dir(ingentia_path, ingentia_temp)
        SubSourceJson.name = source_name
        SubSourceJson.uri = url
        fs.writeFileSync(path.join(ingentia_temp, 'conf/configuration/subSourceConfig.xml'), SubSourceJsonBuilder.buildObject(SubSourceJson))
        copy_file(path.join(source_dir, 'webForumConfiguration.xml'), path.join(ingentia_temp, 'conf/configuration/webForumConfiguration.xml'))
        jsonParser.parseString(fs.readFileSync(path.join(source_dir, 'webForumConfiguration.xml')), function(err, result) {
            WebForumObj.url = result.configuration.UrlTransformation
            WebForumObj.thread = result.configuration.ThreadTransformation
        })
        copy_file(path.join(source_dir, source_name + '-url.xq'), path.join(ingentia_temp, 'conf/transformation', WebForumObj.url + '.xq'))
        copy_file(path.join(source_dir, source_name + '-thread.xq'), path.join(ingentia_temp, 'conf/transformation', WebForumObj.thread + '.xq'))
        return ingentia_temp
    }
    /*单个线程运行*/
    const thread_run = (thread_index, source_dir, pids, urls, show_msg) => {
        const url = urls.shift()
        const ingentia_path = copy_ingentia_resource(source_dir, url)
        show_msg(print_msg(util.format('thread-%d running: %s', thread_index, url)))
        show_msg(print_msg('Start to run Ingentia.'))
        // console.log('thread_run')
        const java = spawn("java", ["-jar", "ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar", "-c", "legacythread"], {
            cwd: ingentia_path
        })
        java.stdout.setEncoding("ASCII")
        const stderrRl = readline.createInterface({
            input: java.stderr,
            crlfDelay: Infinity
        })
        stderrRl.on('line', (line) => {
            if (/Caused by:/.test(line)) {
                show_msg(line)
            }
        })
        java.on('error', (err) => {
            console.error(`错误 ${err} 发生`)
        })
        java.on('exit', (code, signal) => {
            console.log(`子进程收到信号 ${signal} 而终止`)
            if (code == 0) {
                show_msg(util.format('Url: %s 测试完毕', url))
                pids.splice(thread_index, 1, thread_run(thread_index, source_dir, pids, urls, show_msg))
                // console.log(`子进程退出码：${code}`)
            } else {
                // console.log(`子进程退出码：${code}`)
                // console.log("------------------------------")
            }
        })
        return java.pid
    }
    /*同步遍历拷贝文件目录*/
    const copy_dir = (src, dir) => {
        fs.readdirSync(src).forEach((file) => {
            if (file != 'script' && file != 'subSourceConfig.xml') {
                const _src = path.join(src, file)
                const _dir = path.join(dir, file)
                if (fs.statSync(_src).isDirectory()) {
                    fs.mkdirSync(_dir)
                    copy_dir(_src, _dir)
                } else {
                    copy_file(_src, _dir)
                }
            }
        })
    }
    /*复制文件*/
    const copy_file = (src, dir) => {
        // fs.createReadStream(src).pipe(fs.createWriteStream(dir)) //异步
        fs.writeFileSync(dir, fs.readFileSync(src)); //同步
    }
    /*删除目录*/
    const delete_dir = (dir_path) => {
        if (fs.existsSync(dir_path)) {
            const dirs = fs.readdirSync(dir_path)
            dirs.forEach((file, index) => {
                const curPath = path.join(dir_path, file)
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    delete_dir(curPath)
                } else { // delete file
                    fs.unlinkSync(curPath)
                }
            });
            fs.rmdirSync(dir_path)
        }
    };
    /*检查文件完整性*/
    const check_config_file = (source_dir, name = '') => {
        if (name) {
            if (!fs.existsSync(path.join(source_dir, name))) {
                show_msg(util.format('配置文件 [%s] 不存在，请检查！', name))
            }
        } else {
            show_msg('文件夹不存在，请谨慎选择！')
        }
    }
    /*读取finished.xml*/
    const read_finished_xml = (source_dir) => {
        const file = path.join(source_dir, 'finished.xml')
        let urls = []
        jsonParser.parseString(fs.readFileSync(file), function(err, result) {
            urls = result.sourceurls.sourceurl.map(function(elem, index) {
                return elem.url
            })
        })
        return urls
    }
    return {
        run
    }
}

exports.Url = url_run();
exports.Subforum = subforum_run();