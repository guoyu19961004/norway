var pageNumber = 0;
var timer_is_on = false;
var is_send = false;

function getLoadMore() {
	var doc = jQuery("iframe[src*='http://disqus.com/embed/comments']").contents()[0];
	var loadMore = doc.getElementsByClassName("load-more");
	for ( var i = 0; i < loadMore.length; i++) {
		var more = loadMore[i];
		var a_more = more.getElementsByClassName("btn");
		var a_text = a_more[0].innerText;
		if (a_text.indexOf("comments") > 0) {
			if (jQuery(a_more).parent()[0].style.display != "none") {
				return a_more;
			}
		}
	}
	return null;
}

function shouldProcessState() {
	if (getLoadMore()) {
		return true;
	}
	return false;
}
function fireStateEvent() {
	var element = getLoadMore();
	var mouseEvent = document.createEvent('MouseEvent');
	mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,
			false, false, false, 0, null);
	element[0].dispatchEvent(mouseEvent);
}
function doOperationOnState() {
	if (shouldProcessState()) {
		getSerizlizedIframe();
		fireStateEvent();
		setTimeout('doOperationOnState()', 5000);
	} else {
		is_send = true;
	}
	if (is_send) {
		sendResponse();
	}
}

function sendResponse() {
	var links = jQuery('a[href]').attr('href');
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
	return xml + getSerizlizedIframe();
}

function getSerizlizedIframe() {
	var doc = jQuery("iframe[src*='http://disqus.com/embed/comments']");
	if (doc != null && doc.length > 0) {
		doc = doc.contents()[0];
		var serializer = new XMLSerializer();
		var xml = serializer.serializeToString(doc);
		return xml;
	}
	return "";
}

function fireStateEvents() {
	if (!timer_is_on) {
		timer_is_on = true;
		setTimeout('doOperationOnState()', 6000);
	}
}

function scrollToComment() {
	var element = document.getElementById('disqus_thread');
	if (element != null) {
		var actualTop = element.offsetTop;
		var current = element.offsetParent;
		while (current !== null) {
			actualTop += current.offsetTop;
			current = current.offsetParent;
		}
		scroll(0, actualTop);
	}
	setTimeout('fireStateEvents()', 6000);
}

jQuery(document).ready(function() {
	var count = 0;
	jQuery.getScript('http://sitename.disqus.com/embed.js', function() {
		var loader = setInterval(function() {
			var disabledCommInf = jQuery("#commenting_links > li").text();
			var closedCommInf = jQuery("span[class=post-comments] > span").text();
			var disqusCommentsNode =  jQuery('#disqus_thread');
			if (disqusCommentsNode && disqusCommentsNode.html()) {
				clearInterval(loader);
				setTimeout('scrollToComment()', 6000);
			} else if(disabledCommInf.indexOf("disabled") != -1 || closedCommInf.indexOf("關閉") != -1 || count >=10) {
				clearInterval(loader);
				setTimeout('sendResponse()', 6000);
			}
			count ++;
		}, 1000);
	});
});
