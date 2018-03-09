var TIMEOUT = 1000;
var pageNumber = 0;

function shouldProcessState() {
	var nextPageNode = $('li[rel=next-page][class="next bgcolor9"]')[0];
	
	if (nextPageNode) {
		return true;
	} else {
		return false;
	}
}
function fireStateEvent() {
	var nextPageNode = $('li[rel=next-page][class="next bgcolor9"]')[0];
	nextPageNode.click();
	pageNumber += 1;
	setTimeout('scrollToComment()', 3*TIMEOUT);
}
function doOperationOnState() {
	var links = $("link")[0].href;;
	var requestObject = {
		links : links,
		response : getSerializedDom(),
		pages : pageNumber,
		isLast : false
	};

	if (shouldProcessState()) {
		chrome.extension.sendRequest(requestObject);
		setTimeout('fireStateEvent()', 2*TIMEOUT);
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
	var element = document.getElementsByClassName('footer')[0];
	if (element != null) {
		var actualTop = element.offsetTop;
		scroll(0, actualTop);
	}
	setTimeout('doOperationOnState()', 3*TIMEOUT);
}

$(document).ready(function() {
	setTimeout('scrollToComment()', 3*TIMEOUT);
});