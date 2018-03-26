/*
 * @Author: Administrator
 * @Date:   2018-03-22 10:53:41
 * @Last Modified by:   guoyu19961004
 * @Last Modified time: 2018-03-26 16:42:52
 */
const fs = require('fs')
const path = require('path')
const util = require('util')
const xml2js = require('xml2js')
const cheerio = require('cheerio')
const { URL, URLSearchParams } = require('url')
const { exec, spawn, spawnSync } = require('child_process')

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

const jsonParser = new xml2js.Parser({
    explicitArray: false //一个子节点直接访问不生成数组
})

/*ES6数组去重*/
// const unique = (array) => {
//    return Array.from(new Set(array));
// }
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
    const run = (config_path, show_msg) => {

        const config = get_config(config_path, show_msg)
        // console.log(config)
        const first_url = {
            link: config['FirstUrl'],
            description: config['SourceName']
        }
        add_to_visit_queue(first_url)
        while (visit_queue.length != 0) {
            /*选取并去除数组中的第一个*/
            const url = visit_queue.shift()
            // console.log(url)
            const link = url.link
            const description = url.description
            // let visit_link = 'https://club.omlet.co.uk/forum/forum/37-other-omlet-products/'
            let visit_link = link
            if (link == config['FirstUrl']) {
                visit_link = link
            } else {
                visit_link = append_parameters_to_url(link, config['VisitAddon'])
            }
            // console.log(visit_link)
            show_msg(print_msg(util.format('Visiting %s', visit_link)))
            const download_obj = dump_page_ingentia(visit_link, config['InputEncoding'])
            if (download_obj.status == 0) {
                // console.log(download_obj.stdout.toString())
                add_to_visit_queue(get_urls_from_dump(config))
                visit_history.push(url)
                // console.dir(get_urls_from_dump(config))
                // console.log(visit_queue.length)
                // console.dir(visit_queue)
                if (match_filter(visit_link, convert_to_common_regular(config['SubsourceUriPattern']))) {
                    show_msg(print_msg(util.format('Transforming %s', visit_link)))
                    const url_info = is_subsource_valid(config['UrlTransformation'], link_dump_path, visit_link, 0)
                    if (url_info.status) {
                        url.link = append_parameters_to_url(url.link, config['UrlAddon'])
                        const sourceurl = build_sourceurl(url.link, config['SourceName'], url.description)
                        // console.log(result)
                        subsources.push({sourceurl})
                    } else {
                        failed_subsources.push(url)
                    }
                    show_msg(print_msg(url_info.msg))
                } else {
                    visit_history.push(url)
                }
                // console.log(visit_queue)
                // console.log(visit_history)
            } else {
                console.log(download_obj.stderr.toString())
            }
        }
        while (failed_subsources.length != 0) {
            /*选取并去除数组中的第一个*/
            const url = failed_subsources.shift()
            // console.log(url)
            const link = url.link
            const description = url.description
            const visit_link = append_parameters_to_url(link, config['VisitAddon'])
            // console.log(visit_link)
            show_msg(print_msg(util.format('Validating %s', visit_link)))
            const download_obj = dump_page_ingentia(visit_link, config['InputEncoding'])
            if (download_obj.status == 0) {
                // console.log(download_obj.stdout.toString())
                show_msg(print_msg(util.format('Transforming %s', visit_link)))
                const url_info = is_subsource_valid(config['UrlTransformation'], link_dump_path, visit_link, 0)
                if (url_info.status) {
                    url.link = append_parameters_to_url(url.link, config['UrlAddon'])
                    const sourceurl = build_sourceurl(url.link, config['SourceName'], url.description)
                    // console.log(result)
                    subsources.push({sourceurl})
                }
                show_msg(print_msg(url_info.msg))
            } else {
                console.log(download_obj.stderr.toString())
            }
        }
        fs.writeFileSync(path.join(config_path, '../finished.xml'), jsonBuilder.buildObject(subsources))
        console.log(subsources)
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
                callback(2) //传入参数表示SubSourceCrawlerConfig.xml是空的
            }
        } else {
            callback(1) //传入参数表示SubSourceCrawlerConfig.xml不存在
        }
    }
    /*生成打印信息*/
    const print_msg = (msg) => {
        const date = new Date()
        return util.format('INFO: %d-%d-%d %d:%d:%d %s', date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), msg)
    }
    /*添加访问链接*/
    const add_to_visit_queue = (urls) => {
        if (urls.length) {
            urls.forEach((currentValue, index) => {
                /*判断链接是否访问过*/
                if (visit_history.some((element) => {
                        return (currentValue.link == element.link)
                    })) {
                    // console.log('visited')
                } else if (visit_queue.some((element) => {
                        return (currentValue.link == element.link)
                    })) {
                    // console.log('visit_queue exists')
                } else {
                    visit_queue.push(currentValue)
                }
            })
        } else if (urls.length != 0) {
            if (visit_history.some((element) => {
                    return (urls.link == element.link)
                })) {
                // console.log('visited')
            } else if (visit_queue.some((element) => {
                    return (urls.link == element.link)
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
        return spawnSync("java", ["-jar", "ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar", "-c", "clean", "tagsoup", url, encoding], {
            cwd: ingentia_path,
            shell: true
        });
        // console.log(java.status)
        // if (java.status == 0) {
        //     // console.log(java.stdout.toString())
        //     // add_to_visit_queue(get_urls_from_dump(config))
        // } else {
        //     console.log(java.stderr.toString())
        // }
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
        const SAXON9HE_JAR_PATH = path.join(root_path, 'environment/Tmonkey/dm_tmonkey_sandbox/libs/saxon9he.jar')
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
    /**/
    const build_sourceurl = (url, source_name, description) => {
        return {
            url: url,
            descriptions: {
                description: source_name + ": " + description
            }
        }
    }
    return {
        run,
        add_to_visit_queue
    }
}

exports.Url = url_run();
exports.unique = unique;