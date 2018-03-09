/*
 * @Author: Administrator
 * @Date:   2018-03-09 19:40:26
 * @Last Modified by:   Administrator
 * @Last Modified time: 2018-03-09 23:03:39
 */
const fs = require('fs')
const path = require('path')
const url = require('url')

const resource_path = path.join(__dirname, '../resources')
const root_path = path.join(__dirname, '../')

const log_path = path.join(root_path, 'environment/ingentia-run/logs/transformed.log')
const rs = fs.createReadStream(log_path)
rs.setEncoding('utf8')
let body = '<root>'

$(document).ready(function() {
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
                let $parent = $('<li></li>').addClass("collection-item").appendTo($('#content-wrap'))
                generatePostList(val.generalThreadEntries["no.integrasco.domain.xml.blog.BlogPost"], $parent)
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
    // console.log(jsonParser.parseString())
});

function generatePostList(arg, $parent) {
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