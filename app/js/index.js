/*
 * @Author: Administrator
 * @Date:   2017-11-23 18:09:20
 * @Last Modified by:   Administrator
 * @Last Modified time: 2018-03-03 14:05:09
 */
const electron = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')
const xml2js = require('xml2js')

//创建builder的时候参数说明：
//rootName (default root or the root key name)
//renderOpts (default { 'pretty': true, 'indent': ' ', 'newline': '\n' })
//xmldec (default { 'version': '1.0', 'encoding': 'UTF-8', 'standalone': true }
//headless (default: false)
//cdata (default: false): wrap text nodes in <![CDATA[ ... ]]>
var jsonBuilder = new xml2js.Builder({
    rootName: 'sources',
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


const resource_path = path.join(__dirname, '../resources')

function checkDirExist(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch (e) {
        if (e.code == 'ENOENT') { // no such file or directory. File really does not exist
            console.log("File does not exist.");
            return
            false;
        }
        console.log("Exception fs.statSync (" + path + "): " + e);
        throw e;
        // something else went wrong, we don't have rights, ...
    }
}
//获取Tmonkey web中source信息存放到resources/sources.xml
$.ajax({
    type: "POST",
    url: "http://138.197.2.242:10000/",
    data: {
        username: 'u281413384@gmail.com',
        password: '123456',
        login: 'Login'
    },
    success: function(msg) {
        $.get('http://138.197.2.242:10000/api/outsource/source/', function(sources) {
        	let xml = ''
        	let source = {
        		source: sources
        	}
            if (checkDirExist(resource_path)) {
            	xml = jsonBuilder.buildObject(source)
                fs.writeFileSync(path.join(resource_path, 'sources.xml'), xml)
                console.log('xml done')
            } else {
                fs.mkdirSync(resource_path)
            	xml = jsonBuilder.buildObject(source)
                fs.writeFileSync(path.join(resource_path, 'sources.xml'), xml)
                console.log('xml done')
            }
        }, 'json')
    }
})