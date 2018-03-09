var jumpToFoot = true;
var mouseEvent = null;

function getSerializedDom() {
    var serializer = new XMLSerializer();
    var xml = serializer.serializeToString(document);
    return xml;
}

function shouldProcessState() {   
    var moreComments = $("div[class=pagination] > b > a[class=load-more-comments]");
    if (moreComments.length == 0) {
        return false;
    } else {
    	var display = moreComments.parent()[0].style.display;
    	if(display == "none"){
    		return false;
    	}else{
    		return true;
    	}
    }
}

function fireStateEvent() {
    mouseEvent = document.createEvent('MouseEvent');
    mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, 0,null);
    var moreComments = $("div[class=pagination] > b > a[class=load-more-comments]");
    moreComments[0].dispatchEvent(mouseEvent);
    setTimeout('showReplay()', 8000);
}

function doOperationOnState() {
    if (shouldProcessState()) {
        setTimeout('fireStateEvent()', 1000);
    } else {
        var links = $("link[rel=alternate]")[0].href;
        var requestObject = {
            links : links,
            response : getSerializedDom(),
            pages : 1,
            isLast : true
        };
        chrome.extension.sendRequest(requestObject);
    }
}

function clickReply(commentNode,isLast){
    mouseEvent = document.createEvent('MouseEvent');
    mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, 0,null);
    commentNode.dispatchEvent(mouseEvent);

    if(isLast){
        setTimeout('showReplay()', 5000);
    }
}

function showReplay(){
	var repliesNodes = $("div[class=comment] > b[class=toggle-thread]");
    var replyArray =new Array();
    repliesNodes.each(function(i, reply) {
        if(reply.style.display != "none"){
            var comment = $(reply).parent().find($("div[id*=aol-comments-thread]"))[0];
            if(comment.style.display == "none" || $(comment).children().length == 0){
                var commentNode = $(reply).find($("a[class=toggle-link]"))[0];
                replyArray.push(commentNode);
            }
        }
    });

    if(replyArray.length == 0){
        setTimeout('doOperationOnState()', 5000);
    }else{
        for (var i = 0; i < replyArray.length; i++) {
            var isLast = (i+1) == replyArray.length;
            var commentNode = replyArray[i];
            setTimeout(function(){
                clickReply(commentNode,isLast);
            },i*800);
        };
    }
}

function scrollToComment() {
    if (jumpToFoot) {
        var element = document.getElementById('f1');
        if (element != null) {
            jumpToFoot = false;
            var actualTop = element.offsetTop;
            var current = element.offsetParent;
            while (current !== null) {
                actualTop += current.offsetTop;
                current = current.offsetParent;
            }
            scroll(0, actualTop);
        }
        setTimeout('showReplay()', 2000);
    }
}

$(document).ready(function() {
    setTimeout('scrollToComment()', 3000);
});
