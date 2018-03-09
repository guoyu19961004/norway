var timeout;
var counter = 0;
var timer_is_on = false;
function getParamFromQuery(query, param, default_value) {
	var reg = new RegExp(param.concat('=', '([^&amp;#]+)'));
	var result = reg.exec(query);
	if (result) {
		var value = result[1];
		return value;
	} else {
		return default_value;
	}
}
function IDPageLoad(page) {
	var blogpostid = $('input[name=blogpostid]').attr('value');
	/*if(!blogpostid){
		blogpostid = jQuery("link[rel=shortlink]").attr("href");
		var strArr = blogpostid.split("?");
		if(strArr.length >= 2) {
			var paramArr = strArr.split("&");
			for(var i=0;i<paramArr-1;i++) {
				if(paramArr[i] == "p") {
					blogpostid = paramArr[i+1];
					break;
				}
			}
			
		}
	}*/
	var acctid = $('input[name=IDtxtWPIDSiteID]').attr('value');
	var userid = 'undefined';
	var sortType = 'rating';
	var commentid = 0;
	var gotocomments = 'undefined';
	var newScriptTag = document.createElement('script');
	newScriptTag.type = 'text/javascript';
	newScriptTag.src = 'http://intensedebate.com/idc/js/getInnerComments.php?postid='
			+ blogpostid
			+ '&amp;acctid='
			+ acctid
			+ '&amp;userid='
			+ userid
			+ '&amp;sort='
			+ sortType
			+ '&amp;page='
			+ page
			+ '&amp;commentid='
			+ commentid + '&amp;gotocomments=' + gotocomments;
	document.getElementsByTagName('head')[0].appendChild(newScriptTag);
}
function collapseThread(commentid) {
	var postid = $('input[name=blogpostid]').attr('value');
	var acctid = $('input[name=IDtxtWPIDSiteID]').attr('value');
	var userid = 'undefined';
	var startindex = 0;
	var newScriptTag = document.createElement('script');
	newScriptTag.type = 'text/javascript';
	newScriptTag.src = 'http://intensedebate.com/idc/js/getInnerCommentsChildren.php?postid='
			+ postid
			+ '&amp;acctid='
			+ acctid
			+ '&amp;userid='
			+ userid
			+ '&amp;commentid=' + commentid + '&amp;startindex=' + startindex;
	document.getElementsByTagName('head')[0].appendChild(newScriptTag);
}
function shouldProcessState() {
	var state = $('span.activepage:last').next().length != 0;
	return state;
}
function fireStateEvent() {
	var reply = $('span.activepage:last').next();
	reply.click();
}
function doOperationOnState() {
	var links = $('a[href]').attr('href');
	var requestObject = {
		links : links,
		response : getSerializedDom(),
		pages : counter,
		isLast : false
	};
	if (shouldProcessState()) {
		chrome.extension.sendRequest(requestObject);
		fireStateEvent();
		counter = counter + 1;
		timeout = setTimeout('doOperationOnState()', 5000);
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
function fireStateEvents() {
	if (!timer_is_on) {
		timer_is_on = true;
		timeout = setTimeout('doOperationOnState()', 5000);
	}
}
function scrollToComment() {
	var element = document.getElementById('comments');
	if (element != null) {
		var actualTop = element.offsetTop;
		var current = element.offsetParent;
		while (current !== null) {
			actualTop += current.offsetTop;
			current = current.offsetParent;
		}
		scroll(0, actualTop);
	}
	fireStateEvents();
}
$(document).ready(function() {
	scrollToComment();
});
IDPageLoad(getParamFromQuery(location.href, 'page', '0'));
