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

	var scrollEle = $('#mc-container')[0];
	if (scrollEle === undefined) {
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	};
	
	scrollToElement(scrollEle);

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $(".mc-comment-list")[0];
		if (commentEle) {
			clearInterval(commentEleCheckIntervalId);

			setTimeout(function() {
				var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

					if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
						
						var loadMoreEle = $(".mc-button.mc-comment-next")[0];

						if (loadMoreEle) {
							var displayEle = loadMoreEle.parentElement;
							
							operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
						};
					};

				}, 1000);
			}, 0);
		}

	}, 1000);
}
 

function getCurrentAsynMark() {
	return $(".mc-comment-list li").length;
	
}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	console.debug(shouldLoadMore(loadMoreEle, displayEle));	

	if (shouldLoadMore(loadMoreEle, displayEle)) {
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


