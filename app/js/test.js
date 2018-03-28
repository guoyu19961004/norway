const path = require('path')
const forum = require('./forum.js')
const { exec, spawn, spawnSync } = require('child_process')
const readline = require('readline')
const ingentia_temp = 'D:/biyesheji/norway-project/app/environment/temp/omlet.co.uk/ingentia-Qnc27b'
const first_url = {
    link: 'config',
    description: 'sourceName'
}
const pids = []
// const visit_queue = []
// const visit_history = []

// forum.Url.run(path.join('D:/biyesheji/Norway/finish', 'SubSourceCrawlerConfig.xml'),(msg) => {
//     console.log(msg);
//     // $('#shell_info').append('<p>' + msg + '</p>')
// })


forum.Subforum.run('D:/biyesheji/Norway/source/omlet.co.uk',pids,(msg) => {
    console.log(msg);
    // $('#shell_info').append('<p>' + msg + '</p>')
})
// console.log(pids)