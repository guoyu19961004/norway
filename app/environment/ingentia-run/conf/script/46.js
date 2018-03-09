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
	var mark = $("#news-content")[0];

	if (mark) {

		var operationOnLoadMorePostsIntervalId =  setInterval(function() {
			scrollElement = $("#ajax-appendContentPage")[0];
			scrollToElement(scrollElement);

			if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
				var loadMoreEle =  $("#ajax-appendContentPage")[0];
				if (loadMoreEle) {
					var displayEle = loadMoreEle;
					operationOnLoadMorePosts(loadMoreEle, displayEle, operationOnLoadMorePostsIntervalId);
				};
			};

		}, 1000);

	} else {

		var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
			scrollElement = $(".button.show-comments-button")[0];
			scrollToElement(scrollElement);
			console.log("load comment");
			if(checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
				var loadMoreEle =  $(".button.show-comments-button")[0];
				operationOnLoadMoreComments(loadMoreEle, operationOnLoadMoreCommentsIntervalId);
			}else{
				console.log("loadMoreComments is false");
				var requestObj = createRequestObject(pageNum, null, true, getSerializedDoc());
				sendRequest(requestObj);
			}

		}, 1000);
	}
}


function getCurrentAsynMark() {
	var mark = $("#news-content")[0];

	if (mark) {
		return $(".news-list article.news-item").length;
	}else{
		return $(".comment-list .comment").length;
	}

}

function operationOnLoadMorePosts(loadMoreEle, displayEle, operationOnLoadMorePostsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);

	if (shouldLoadMore(loadMoreEle, displayEle) && pageNum <= 20) {
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

function operationOnLoadMoreComments(loadMoreEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	if (loadMoreEle) {
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
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}
}
