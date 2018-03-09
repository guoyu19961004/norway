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
	var mark = $("#loading")[0];

	if (mark) {
		
		var operationOnLoadMorePostsIntervalId =  setInterval(function() {
			scrollToBottom();
			if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
				var loadMoreEle =  $("#loading")[0];
				console.debug(loadMoreEle);
				if (loadMoreEle) {
					var displayEle = null;
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
	if($("#listing-items")[0]) {
		return $("#listing-items li").length;
	} else {
		return $(".mid-page .nu-row").length;
	}
}

function operationOnLoadMorePosts(loadMoreEle, displayEle, operationOnLoadMorePostsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	
	if (shouldLoadMore(loadMoreEle, displayEle) && pageNum <= 5) {
		if (loadCount < 5) {

			asynMark = getCurrentAsynMark();
			scrollToBottom();

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
