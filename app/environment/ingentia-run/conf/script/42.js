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

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $("#comments-container")[0];
		if (commentEle) {
			clearInterval(commentEleCheckIntervalId);

			scrollToElement(commentEle);
			setTimeout(function() {
				var operationOnNextPageIntervalId =  setInterval(function() {

					if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
						var commentsTab = $(".comments-content-message")[0];
						
						if (commentsTab) {
							
							if (commentsTab.className.indexOf("active") == -1) {
								
								commentsTab.getElementsByTagName("a")[0].click();
							} else {
								
								var loadMoreEle = $(".next .btn")[0];
								var displayEle = null;
								if (loadMoreEle) {
									displayEle = loadMoreEle.parentElement;
								}
								operationOnNextPageInterval(loadMoreEle, displayEle, operationOnNextPageIntervalId);
							}
						}
					}

				}, 1000);
			}, 3000);
		}

	}, 1000);
}
 

function getCurrentAsynMark() {
	var comment = $("#non-pundits .comments")[0];
	if (comment) {
		return comment.id;
	}
	return 0;
}

function operationOnNextPageInterval(loadMoreEle, displayEle, operationOnNextPageIntervalId) {
	console.log(pageNum);
	console.log(loadMoreEle && displayEle.className.indexOf("disabled") == -1);

	var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());

	if (loadMoreEle && displayEle.className.indexOf("disabled") == -1) {
		
		sendRequest(requestObj);
		asynMark = getCurrentAsynMark();
		clickNode(loadMoreEle);
		pageNum ++;
		
	} else {
		clearInterval(operationOnNextPageIntervalId);
		requestObj.isLast = true;
		sendRequest(requestObj);
	}
}
