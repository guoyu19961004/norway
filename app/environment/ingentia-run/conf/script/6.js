var pageNum = 0;
var loadCount = 0;
var asynMark = null;
setTimeout(function() {
	var readyStateCheckIntervalId = setInterval(function() {
		if (isPageLoaded()) {
			console.log("ready");
			clearInterval(readyStateCheckIntervalId);

			onPageReady();
		};
	}, 1000);

}, 2000);

function onPageReady() {
	console.log("onPageReady");
	
	var commentContainer = jQuery(".article-extra")[0];
	if(commentContainer) {
		scrollToElement(commentContainer);
	}
	var loadCommentsCount = 0;
	var commentEleCheckIntervalId = setInterval(function() {

		
		var commentEle = jQuery("iframe[src*='www.facebook.com/plugins/comments']")[0];
		console.debug(commentEle);
		
		if (checkByEle(commentEle) ) {
			clearInterval(commentEleCheckIntervalId);

			setTimeout(function() {
				var count = 0;
				var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
					
					if (checkByAsynMarkValue(asynMark, getCurrentAsynMark(count))) {
						
						console.log(jQuery("iframe[src*='www.facebook.com/plugins/comments']").contents()
							.find("span._50f3").length);
						
						var loadMoreComments = jQuery("iframe[src*='www.facebook.com/plugins/comments']").contents()
						.find("span[data-reactid='.0.0.2.1.0.1']")[0];
						
						var loadMoreReplies = jQuery("iframe[src*='www.facebook.com/plugins/comments']").contents()
						.find("span._50f3")[0];

						if(loadMoreComments){
							var loadMoreEle = loadMoreComments;
						} else {
							var loadMoreEle = loadMoreReplies; 
						};

						operationOnLoadMoreComments(loadMoreEle, null, operationOnLoadMoreCommentsIntervalId);
						count = 0;
					};
					count ++;
				}, 1000);
			}, 3000);
		}
		if(loadCommentsCount >= 20) {
			operationOnLoadMoreComments(null, null, commentEleCheckIntervalId);
		}
		loadCommentsCount ++;
	}, 1000);
}
 

function getCurrentAsynMark(count) {
	var commentsDoc = jQuery("iframe[src*='www.facebook.com/plugins/comments']").contents();
	if (commentsDoc.length) {
		length = commentsDoc.find("._3-8y").length;
		if (count > 10) {
			length += 1;
		};
		return length;
	};
	return null;
}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	console.debug(shouldLoadMore(loadMoreEle, displayEle));	

	if (shouldLoadMore(loadMoreEle, displayEle)) {
		if (loadCount < 4) {

			asynMark = getCurrentAsynMark(0);
			clickNode(loadMoreEle);

			loadCount ++;

		} else {
			var commentsDoc = jQuery("iframe[src*='www.facebook.com/plugins/comments']")[0];
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		var commentsDoc = jQuery("iframe[src*='www.facebook.com/plugins/comments']")[0];
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		sendRequest(requestObj);
	}
}
