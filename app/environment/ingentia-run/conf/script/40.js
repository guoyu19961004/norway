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
	var mark = $("#contentlist-newest")[0];

	if (mark) {
		
		var operationOnLoadMorePostsIntervalId =  setInterval(function() {
			scrollElement = $(".buttony.load-more.only-js")[0];
			scrollToElement(scrollElement);

			if (scrollElement) {
				var loadMoreEle = $(".buttony.load-more.only-js")[0];
				
				operationOnLoadMorePosts(loadMoreEle, null, operationOnLoadMorePostsIntervalId);
			};

		}, 1000);

	} else {
		operationOnComments();
	}


}
 

function getCurrentAsynMark() {
	return $("#contentlist-newest article").length;
}

function operationOnLoadMorePosts(loadMoreEle, displayEle, operationOnLoadMorePostsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);

	if (shouldLoadMore(loadMoreEle, displayEle) && pageNum <= 20) {
		if (loadCount < 5) {

			checkByAsynMarkValue(asynMark, getCurrentAsynMark());
			clickNode(loadMoreEle);
			loadCount ++;

		} else {
			
			var requestObj = createRequestObject(pageNum, null, false, getSerializedDoc());
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		clearInterval(operationOnLoadMorePostsIntervalId);
		var requestObj = createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}
}

function operationOnComments() {
	console.log(pageNum);

	scrollToBottom();

	var loadCommentsIntervalId = setInterval(function() {
		var comments = $("#article-comments .comments")[0];
		if (comments) {
			clearInterval(loadCommentsIntervalId);
			var requestObj = createRequestObject(pageNum, null, true, getSerializedDoc());
			sendRequest(requestObj);
		};
	}, 1000);
}