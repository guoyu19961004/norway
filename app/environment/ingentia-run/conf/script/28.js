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

	var scrollEle = $('#commentsDiv')[0];
	scrollToElement(scrollEle);
	
	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $(".gig-comments-comments")[0];

		if (commentEle) {
			clearInterval(commentEleCheckIntervalId);

			var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
				if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
                    var loadMoreEle = $('.gig-comments-more')[0];
                    if(loadMoreEle) {
                        var diaplayEle = loadMoreEle;
                        operationOnLoadMoreComments(loadMoreEle, diaplayEle, operationOnLoadMoreCommentsIntervalId);
                    } else {
                        console.log("NO Loadmore Element found");
                        clearInterval(commentEleCheckIntervalId);
                    }
                }
			}, 1000);
		}
	},1000);
}

function getCurrentAsynMark() {
	return $(".gig-comments-comments .gig-comment").length;
	
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
