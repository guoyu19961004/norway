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

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $('#comments')[0];
		if (commentEle) {
			clearInterval(commentEleCheckIntervalId);

			scrollToElement(commentEle);
			var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

				if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
					
					var loadMoreEle = $(".load-morecomments.loadmore")[0];
					
					operationOnLoadMoreComments(loadMoreEle, operationOnLoadMoreCommentsIntervalId);
				};

			}, 1000);
		}

	}, 1000);
}
 

function getCurrentAsynMark() {
	return $('#comments .comment').length;
	
}

function operationOnLoadMoreComments(loadMoreEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	console.debug(shouldLoadMore(loadMoreEle));	

	if (loadMoreEle && loadMoreEle.className.indexOf("hidden") == -1) {
		if (loadCount < 4) {

			asynMark = getCurrentAsynMark();
			clickNode(loadMoreEle);

			loadCount ++;

		} else {
			
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}
}


