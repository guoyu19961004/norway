var pageNum = 0;
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
	var scrollElement = $("#forumTopicContent")[0];
	scrollToElement(scrollElement);

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $('#get-all-comments')[0];
		if (commentEle) {
			commentEle.click();
			clearInterval(commentEleCheckIntervalId);


			var operationOnNextPageIntervalId =  setInterval(function() {

				if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {

					var loadMoreEle = $("#all-comments-pagination .comments-page:contains(Suivante)")[0];

					operationOnNextPage(loadMoreEle, null, operationOnNextPageIntervalId);
				};

			}, 4000);
		}

	}, 1000);


}


function getCurrentAsynMark() {
	var allComments = $("#all-comments>.user-comment");
	var commentLen = allComments.length;
	if (commentLen > 0) {
		return asynMark + commentLen;
	};

	return 0
}

function operationOnNextPage(loadMoreEle, displayEle, operationOnNextPageIntervalId) {
	console.log(pageNum);
	console.log(shouldLoadMore(loadMoreEle, displayEle));

	if (shouldLoadMore(loadMoreEle, displayEle)) {
		var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
        sendRequest(requestObj);
        pageNum ++;
		asynMark = getCurrentAsynMark();
		clickNode(loadMoreEle);
	} else {
		clearInterval(operationOnNextPageIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
        sendRequest(requestObj);
	}
}
