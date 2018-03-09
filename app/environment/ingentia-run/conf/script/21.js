var jumpToFoot = true;
var pageNumber = 1;
var mouseEvent = null;

function getSerializedDom() {
	var serializer = new XMLSerializer();
	var xml = serializer.serializeToString(document);
	return xml;
}

function shouldProcessState() {
	var nextPage = $("div[class=scp-pag-main] > ul[class=scp-pag-low] > li > a[class=scp-pag-next]");
	if(nextPage.length == 0){
		return false;
	}else{
		return true;
	}
}

function fireStateEvent() {
	mouseEvent = document.createEvent('MouseEvent');
	mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,false, false, false, 0, null);
	var nextPage = $("div[class=scp-pag-main] > ul[class=scp-pag-low] > li > a[class=scp-pag-next]");
	nextPage[0].dispatchEvent(mouseEvent);
	pageNumber = pageNumber+1;
	setTimeout('readyToReview()', 3000);
}

function doOperationOnState() {
	var links = $("link")[1].href;
	var requestObject = {
		links : links,
		response : getSerializedDom(),
		pages : pageNumber,
		isLast : false
	};
	if (shouldProcessState()) {
		chrome.extension.sendRequest(requestObject);
		setTimeout('fireStateEvent()', 2000);
	} else {
		requestObject.isLast = true;
		chrome.extension.sendRequest(requestObject);
	}
}

function showReply(replyNode){
	mouseEvent = document.createEvent('MouseEvent');
	mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,false, false, false, 0, null);
	replyNode.dispatchEvent(mouseEvent);
}

function showReplies(){
	var replies = $("a[class=ic-pst-view-reply] > span[class=ic-pst-view-reply-view] > span[class=ic-pst-total-replies]");
	var index = 1;
	replies.each(function(i, reply) {
		var replyNumber = parseInt($(reply).text());		
		if(replyNumber > 0){
			var replyNode = $(reply).parent().parent();
			setTimeout(function(){
				showReply(replyNode[0]);
			}, index * 3000);
			index+=1;
		}
	});

	setTimeout('doOperationOnState()', index*4000);
}

function readyToReview(){
	try{
		mouseEvent = document.createEvent('MouseEvent');
		mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,false, false, false, 0, null);
		var oldest = $("div[id=ic-sort] > div[class=ic-sort-oldm] > a[id=ic-sort-oldm]");
		oldest[0].dispatchEvent(mouseEvent);

		var showComments = $("div[class=ic-showlnk] > button[id=ic-shw-cmnt]");
		var showText = showComments.text();
		if(showText.indexOf("Show") > -1){
			showComments[0].click();
		}
	}catch(e){
	
	}
	setTimeout('showReplies()', 6000);
}

function scrollToComment() {
	if(jumpToFoot){
		var element = document.getElementById('ic-sort');
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
		setTimeout('readyToReview()', 2000);
	}
}

$(document).ready(function() {
	setTimeout('scrollToComment()', 3000);
});
