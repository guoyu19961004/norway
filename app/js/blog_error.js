/*
* @Author: guoyu19961004
* @Date:   2018-03-12 16:38:07
* @Last Modified by:   guoyu19961004
* @Last Modified time: 2018-03-12 16:38:53
*/

const fs = require('fs')
const path = require('path')

const resource_path = path.join(__dirname, '../resources')
const root_path = path.join(__dirname, '../')

const log_path = path.join(root_path, 'environment/ingentia-run/logs/error.log')
const rs = fs.createReadStream(log_path)
rs.setEncoding('utf8')
let body = '<root>'