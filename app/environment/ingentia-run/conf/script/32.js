var pageNum = 0;


$(document).ready(function () {
    console.log("ready");
    setTimeout(function () {onPageReady();}, 3000);
}); 


function onPageReady() {
    console.log("onPageReady");

    scrollToBottom();

    setTimeout(function() {
        var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
        sendRequest(requestObj);
    }, 3000);
}

