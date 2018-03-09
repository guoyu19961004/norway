var pageNum = 0;
var documentUrl = null;


var readyStateCheckIntervalId = setInterval(function() {
    if (isPageLoaded()) {
        clearInterval(readyStateCheckIntervalId);
        onPageReady();
    }

}, 100);


function onPageReady() {
    console.log("onPageReady");
    var commentLinkNode = $("#post_comment_area #new-posts")[0];
    if(commentLinkNode){
        console.log("Here is a link node,will not to click;");
        setTimeout(function () {
            var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
            sendRequest(requestObj);
        },1000);

    }else{
        console.log("Try to click page node;");
        var commentEleCheckIntervalId = setInterval(function () {
            var loadMore = theNodeToClick();
            var commentsNum = getCurrentAsynMark();
            console.log("commentsNum is "+commentsNum);

            if(commentsNum > 0 && loadMore){
                var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
                sendRequest(requestObj);
                setTimeout(function () {
                    loadMore.click();
                    pageNum ++;
                },1000);
            }else{
                setTimeout(function () {
                    sendLastRequest();
                },1000);
            }

        },3000);

    }
}

function getCurrentAsynMark(){
    return $(".reply.essence").length;
}

function sendLastRequest(){
    var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
    sendRequest(requestObj);
}

function theNodeToClick(){
    var nextPageNodes = $("#mainReplies .pages .beginEnd");
    var nextPageNodesTitle = nextPageNodes[nextPageNodes.length -1].getAttribute("title");
    if(nextPageNodesTitle){
        return nextPageNodes[nextPageNodes.length -1];
    }else{
        return null;
    }
}
