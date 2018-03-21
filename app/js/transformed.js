/*
 * @Author: Administrator
 * @Date:   2018-03-09 19:40:26
 * @Last Modified by:   Administrator
 * @Last Modified time: 2018-03-21 14:17:16
 */
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const root_path = path.join(__dirname, '../')

/*生成BLOG transformed Post节点*/
function generatePostList(prev_content, arg, $parent) {
    $('<div class="collapsible-header"></div').insertBefore($parent).text(prev_content +': '+ arg.timestamp)
    $('<h5>Post Info</h5>').appendTo($parent)
    $('<table></table>').appendTo($parent)
        .append($('<tbody></tbody>').append($('<tr></tr>').append($('<td></td>').append($('<strong>Subject:</strong>')))
                .append($('<td></td>').text(arg.subject)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Author:</strong>')))
                .append($('<td></td>').text(arg.author)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>AuthorUri:</strong>')))
                .append($('<td></td>').text(arg.authorUri)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>AuthorLink:</strong>')))
                .append($('<td></td>').text(arg.authorLink)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Uri:</strong>')))
                .append($('<td></td>').text(arg.uri)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Link:</strong>')))
                .append($('<td></td>').text(arg.link)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Time:</strong>')))
                .append($('<td></td>').text(arg.timestamp)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Content:</strong>')))
                .append($('<td></td>').html(arg.message))))
}

/*生成BLOG transformed Post Comment节点*/
function generateCommentList(arg, $parent) {
    $('<div class="divider"></div>').appendTo($parent)
    $('<table></table>').appendTo($parent)
        .append($('<tbody></tbody>').append($('<tr></tr>').append($('<td></td>').append($('<strong>RootPostUri:</strong>')))
                .append($('<td></td>').text(arg.rootPostUri)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>SequenceNumber:</strong>')))
                .append($('<td></td>').text(arg.sequenceNumber)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>ParentPostUri:</strong>')))
                .append($('<td></td>').text(arg.parentPostUri)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Author:</strong>')))
                .append($('<td></td>').text(arg.author)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>AuthorUri:</strong>')))
                .append($('<td></td>').text(arg.authorUri)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>AuthorLink:</strong>')))
                .append($('<td></td>').text(arg.authorLink)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Uri:</strong>')))
                .append($('<td></td>').text(arg.uri)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Link:</strong>')))
                .append($('<td></td>').text(arg.link)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Time:</strong>')))
                .append($('<td></td>').text(arg.timestamp)))
            .append($('<tr></tr>').append($('<td></td>').append($('<strong>Content:</strong>')))
                .append($('<td></td>').html(arg.message))))
}

/*生成BLOG transformed内容*/
function generateBlogTransformed() {
    const log_path = path.join(root_path, 'environment/ingentia-run/logs/transformed.log')
    const rs = fs.createReadStream(log_path)
    rs.setEncoding('utf8')
    let body = '<root>'
    rs.on('open', function(fd) {
        console.log('文件被打开，开始读取...');
    });
    rs.on('data', function(data) {
        console.log('正在读取数据...');
        body += data;
    });
    rs.on('end', function() {
        body += '</root>';
        jsonParser.parseString(body, function(err, result) {
            $.each(result.root['no.integrasco.domain.xml.blog.BlogPosts'], function(index, val) {
                /* iterate through array or object */
                let $parent = $('<div class="collapsible-body"></div').appendTo($('<li></li>').appendTo($('#content-wrap')))
                generatePostList('Post' + (index + 1),val.generalThreadEntries["no.integrasco.domain.xml.blog.BlogPost"], $parent)
                let commentArgs = val.generalThreadEntries["no.integrasco.domain.xml.blog.BlogPost"].generalThreadEntryComments
                if (commentArgs != '') {
                    $('<h5>Commnet Info</h5>').appendTo($parent)
                    $.each(commentArgs["no.integrasco.domain.xml.generalthread.GeneralThreadComment"], function(index, comment) {
                        /* iterate through array or object */
                        generateCommentList(comment, $parent)
                    });
                }
            });
        })
        console.log('文件被读取完毕。');
    });
    rs.on('close', function() {
        console.log('文件已关闭');
    });
    rs.on('error', function(err) {
        console.log('文件读取出错');
    });
}

/*生成Blog Error页面*/
function generateErrors(type) {
    let log_path;
    if (type == 'blog') {
        log_path = path.join(root_path, 'environment/ingentia-run/logs/errors.log');
    } else log_path = path.join(confData.source, '../','temp/errors.log')
    const rl = readline.createInterface({
      input: fs.createReadStream(log_path),
      crlfDelay: Infinity
    });
    rl.on('line', (line) => {
        if (/Caused by: no.integrasco.ingentia.core.crawler.error.CustomCrawlerErrorException:/.test(line)) {
            let length = line.split(': ').length
            if (/The transformtation failed:/.test(line)) {
                let index = line.indexOf("The transformtation failed:")
                $('<td></td>').text(line.slice(index + "The transformtation failed:".length).trim()).appendTo($('#content-wrap tr:last-child'))
                console.log(`文件的单行内容：${line.slice(index + "The transformtation failed:".length)}`);
            } else if (line.split(': ')[length - 1] != '') {
                $('<td></td>').text(line.split(': ')[length - 1]).appendTo($('#content-wrap tr:last-child'))
                console.log(`文件的单行内容：${line.split(': ')[length - 1]}`);
            }
        } else if (/The url that failed:/.test(line)) {
            $('<td></td>').text(line.slice("The url that failed:".length).trim()).appendTo($('#content-wrap tr:last-child'))
            $('<tr></tr>').appendTo($('#content-wrap'))
            console.log(`文件的单行内容：${line.slice("The url that failed:".length).trim()}`);
        }
    });
    rl.on('close', ()=>{
        $('#content-wrap tr:last-child').remove()
        console.log('error read done');
    });
}

/*生成Forum transformed内容*/
function generateForumTransformed() {
    const log_path = path.join(confData.source, '../','temp/transformed.log')
    const rs = fs.createReadStream(log_path)
    rs.setEncoding('utf8')
    let body = '<root>'
    rs.on('open', function(fd) {
        console.log('文件被打开，开始读取...');
    });
    rs.on('data', function(data) {
        console.log('正在读取数据...');
        body += data;
    });
    rs.on('end', function() {
        body += '</root>';
        jsonParser.parseString(body, function(err, result) {
            if (err) { console.log(err);}
            // console.log(result.root['no.integrasco.domain.xml.generalthread.GeneralMetaThreadEntries']);
            $.each(result.root['no.integrasco.domain.xml.generalthread.GeneralMetaThreadEntries'], function(index, val) {
                /* iterate through array or object */
                let arg = val.generalThreadEntries["no.integrasco.domain.xml.generalthreadforums.ThreadEntryForum"]
                if ($.type(arg) == 'object') {
                    let $parent = $('<div class="collapsible-body"></div').appendTo($('<li></li>').appendTo($('#content-wrap')))
                    generatePostList('Thread' + (index + 1), arg, $parent)
                } else if ($.type(arg) == 'array') {
                    console.log(arg)
                    $.each(arg, function(child_index, child) {
                        /* iterate through array or object */
                        let $parent = $('<div class="collapsible-body"></div').appendTo($('<li></li>').appendTo($('#content-wrap')))
                        generatePostList('Thread' + (index + 1) +'-'+ (child_index + 1), child, $parent)
                    });
                }
            });
        })
        console.log('文件被读取完毕。');
    });
    rs.on('close', function() {
        console.log('文件已关闭');
    });
    rs.on('error', function(err) {
        console.log('文件读取出错');
    });
}

/*暴露生成BLOPOST接口*/
module.exports = {
    BlogTransformed: generateBlogTransformed,
    Error: generateErrors,
    ForumTransfomed: generateForumTransformed
};