const path = require('path')
const forum = require('./forum.js')
const arr = []
const first_url = {
    link: 'config',
    description: 'sourceName'
}
// const visit_queue = []
// const visit_history = []

forum.Url.run(path.join('D:/biyesheji/Norway/finish', 'SubSourceCrawlerConfig.xml'),(msg) => {
    console.log(msg);
    // $('#shell_info').append('<p>' + msg + '</p>')
})
// forum.Url.add_to_visit_queue(forum.unique(arr))
// console.dir(typeof(forum.unique(arr)))
// if (forum.unique(arr).length) {
// 	console.log('length');
// } else if (first_url.length != 0) {
// 	console.log('a')
// } else {
// 	console.log('b')
// }
// console.dir(typeof(first_url))
// console.dir(forum.unique(arr).length)
// console.log(visit_queue)