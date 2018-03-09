var isVisit = false;
var pageNumber = 1;

function doOperationOnState() {
	var links = $("link")[0].href;
	var requestObject = {
		links : links,
		response : getSerializedDom(),
		pages : pageNumber,
		isLast : true
	};

	chrome.extension.sendRequest(requestObject);
}
function getSerializedDom() {
	var serializer = new XMLSerializer();
	var xml = serializer.serializeToString(document);
	return xml;
}

function scrollToComment() {
	var last = $("div").length - 1;
	var element = $("div")[last];
	if (element) {
		var actualTop = element.offsetTop;
		var current = element.offsetParent;
		while (current !== null) {
			actualTop += current.offsetTop;
			current = current.offsetParent;
		}
		scroll(0, actualTop);
	}
	setTimeout('doOperationOnState()', 5000);
}

$(document).ready(function() {
	if (!isVisit) {
		isVisit = true;
		setTimeout('scrollToComment()', 10000);
	}
});