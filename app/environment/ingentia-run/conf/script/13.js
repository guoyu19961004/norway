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

	var scrollEle = $("#comments")[0];
	
	scrollToElement(scrollEle);

	setTimeout(function() {
		var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

			if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
				
				var viewother = $(".comment-toggle[href]")[0];
				if (viewother) {
					viewother.click();
				} else {
					var loadMoreEle = $(".button.button-big.button-contact")[0];
					operationOnLoadMoreComments(loadMoreEle, null, operationOnLoadMoreCommentsIntervalId);
				}
				
			};

		}, 1000);
	}, 3000);
}
 

function getCurrentAsynMark() {
	return $(".comment-list li").length;
	
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
