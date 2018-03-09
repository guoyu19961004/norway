function shouldProcessState() {
	var moreNode = $('div[class=fyre-comment-stream] > div[class=fyre-stream-more]');
	var moreDisplay = moreNode[0].style.display;
	if(moreDisplay == 'none'){
		return false;
	}else{
		return true;
	}
}
function fireStateEvent() {
	var element = $('div[class=fyre-stream-more] > div[class=fyre-stream-more-container]');
	element.click();
}
function doOperationOnState() {
	var links = $('div[class=post-body] > a')[0].href;
	var requestObject = {
		links : links,
		response : getSerializedDom(),
		pages : 0,
		isLast : false
	};
	if (shouldProcessState()) {
		fireStateEvent();
		setTimeout('scrollToComment()', 3000);
	} else {
		requestObject.isLast = true;
		chrome.extension.sendRequest(requestObject);
	}
}
function getSerializedDom() {
	var serializer = new XMLSerializer();
	var xml = serializer.serializeToString(document);
	return xml;
}

function scrollToComment() {
	var element = document.getElementById('grid');
	if (element != null) {
		var actualTop = element.offsetTop;
		var current = element.offsetParent;
		while (current !== null) {
			actualTop += current.offsetTop;
			current = current.offsetParent;
		}
		scroll(0, actualTop);
		setTimeout('doOperationOnState()', 5000);
	}else{
		setTimeout('scrollToComment()', 1000);
	}
}
$(document).ready(function() {
	setTimeout('scrollToComment()', 3000);
});
