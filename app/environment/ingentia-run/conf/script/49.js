var pageNum = 0;
var loadCount = 0;
var asynMark = null;
setTimeout(function() {
	var readyStateCheckIntervalId = setInterval(function() {
		if (isPageLoaded()) {
			console.log("ready");
			clearInterval(readyStateCheckIntervalId);
			onPageReady();
		}

	}, 1000);

}, 2000);

function onPageReady() {
	console.log("onPageReady");
	var mark = $("#LoadContent");

	if (mark.length) {
		
		var operationOnLoadMorePostsIntervalId =  setInterval(function() {
			if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
				var loadMoreEle =  $("#append a")[0];
                operationOnLoadMorePosts(loadMoreEle, null, operationOnLoadMorePostsIntervalId);
			}

		}, 1000);

	} else {
		var requestObj = createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}
}
 

function getCurrentAsynMark() {
	return $("#LoadContent .title-last-update1").length;
}

function operationOnLoadMorePosts(loadMoreEle, displayEle, operationOnLoadMorePostsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	
	if (shouldLoadMore(loadMoreEle, displayEle) && pageNum <= 10) {
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
		requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}
}
