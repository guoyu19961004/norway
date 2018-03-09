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
	var mark = $("#reviews-category-products")[0];

	if (mark) {
		
		var operationOnLoadMorePostsIntervalId =  setInterval(function() {
			scrollToBottom();

			if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
				var loadMoreEle =  $("#reviews-category-loadmore")[0];
				if (loadMoreEle) {
					var displayEle = loadMoreEle.parentElement;
					operationOnLoadMorePosts(loadMoreEle, displayEle, operationOnLoadMorePostsIntervalId);
				};
			};

		}, 1000);

	} else {
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}


}
 

function getCurrentAsynMark() {
	return $(".product-grid>li").length;
	
}

function operationOnLoadMorePosts(loadMoreEle, displayEle, operationOnLoadMorePostsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);

	if (shouldLoadMore(loadMoreEle, displayEle)) {
		if (loadCount < 5) {

			asynMark = getCurrentAsynMark();
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
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}
}
