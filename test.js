/*
* @Author: guoyu19961004
* @Date:   2018-03-08 21:48:54
* @Last Modified by:   guoyu19961004
* @Last Modified time: 2018-03-08 22:05:17
*/

var spawn = require('child_process').spawn;


exe(["/c","java","-version"]);
// �൱������������ִ�� cmd /c java -jar yuicompressor.jar test.js
// Ҳ���Լ������Ĳ���

function exe(command){
    // windows��
    var cmd = spawn("cmd",command);

    cmd.stdout.setEncoding("ASCII");
    cmd.stdout.on("data",function(data){
    console.log("------------------------------");
    console.log("exec",command);
    console.log("stdout:"+data);
    });

    cmd.stderr.on("data",function(data){
    console.log("------------------------------");
    console.log("stderr:"+data);
    console.log("------------------------------");
    });

    cmd.on("exit",function(code){
    console.log("exited with code:"+code);
    console.log("------------------------------");
    });
};