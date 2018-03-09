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

	var scrollEle = $("#forum-container")[0];
	
	scrollToElement(scrollEle);

			setTimeout(function() {
				var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

					if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {

						var displayEle =getCurrentDisplayEle();
						console.debug(displayEle);
						var loadMoreEle = null;
						if (displayEle) {
							loadMoreEle = displayEle.getElementsByTagName("a")[0];
						};
						operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
					};

				}, 1000);
			}, 3000);
}
 

function getCurrentAsynMark() {
	return $("#forum-container .forum_body").length;
	
}

function getCurrentDisplayEle() {
	var displayEles = document.getElementsByClassName("more-comments");
	for (var i = 0; i < displayEles.length; i++) {
		if(displayEles[i].style.display != 'none') {
			return displayEles[i];
		}
	};
	return null;
}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	console.debug(shouldLoadMore(loadMoreEle, displayEle));	

	if (shouldLoadMore(loadMoreEle, displayEle)) {
		if (loadCount < 4) {

			asynMark = getCurrentAsynMark();
			mouseEventClick(loadMoreEle);

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



