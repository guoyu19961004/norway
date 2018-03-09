
function loadComments() {
	var links = null;
	var intvalId = setInterval(function() {
		links= $('iframe[id*=vanilla][name*=vanilla]').contents().find(
		'link[rel=canonical]').attr('href');
		if(links) {
			clearInterval(intvalId);
			setTimeout('doOperationOnState()', 2000);
		}
	}, 1000);
}

function doOperationOnState() {
	var links = $('link[rel=canonical]').attr('href');
	var requestObject = {
		links : links,
		response : getSerializedDom(),
		pages : 0,
		isLast : true
	};
	chrome.extension.sendRequest(requestObject);
}

function getSerializedDom() {
	var serializer = new XMLSerializer();
	var xml = serializer.serializeToString(document);
	return xml + getSerizlizedIframe();
}

function getSerizlizedIframe() {
	var doc = $("iframe[src*='9to5forums.com/index.php?p=/discussion/embed/']");
	if (doc != null && doc.length > 0) {
		doc = doc.contents()[0];
		var serializer = new XMLSerializer();
		var xml = serializer.serializeToString(doc);
		return xml;
	}
	return "";
}

function scrollToComment() {
	var haveCommentIframe = false;
	var element1 = document.getElementById('vanilla-comments');
	if(element1) {
		haveCommentIframe = true;
	}
	var element2 = document.getElementById('respond');
	var element = element1 || element2;
	if (element != null) {
		var actualTop = element.offsetTop;
		var current = element.offsetParent;
		while (current !== null) {
			actualTop += current.offsetTop;
			current = current.offsetParent;
		}
		scroll(0, actualTop);
	}
	if(haveCommentIframe) {
		setTimeout('loadComments()', 5000);
	} else {
		setTimeout('doOperationOnState()', 5000);
	}
}
$(function() {
	var dicussion = $('div[id*=Discussion_]')[0];
	if(dicussion) {
		setTimeout('doOperationOnState()', 5000);
	} else {
		setTimeout('scrollToComment()', 5000);
	}
	
});
