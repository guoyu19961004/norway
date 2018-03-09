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

	var viewCommentsBtn = $(".show-comments.btn")[0];
	if (viewCommentsBtn) {
		clickNode(viewCommentsBtn);
		console.log("click btn to show comments");
	}

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $("#disqus_thread")[0];

		if (checkByEle(commentEle)) {

			var commentsLoadStatus = $("iframe[src*='disqus.com/embed/comments/']").contents().find("#post-list")[0].className;
			console.log(commentsLoadStatus);
			if (commentsLoadStatus.indexOf("loading") == -1) {
				clearInterval(commentEleCheckIntervalId);
				setTimeout(function() {
					var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

						if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
							
							var loadMoreEle = $("iframe[src*='disqus.com/embed/comments/']").contents().find("a[data-action=more-posts]")[0];

							if (loadMoreEle) {
								var displayEle = loadMoreEle.parentElement;
								
								operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
							}
						}

					}, 1000);
				}, 3000);
			}
		}
	}, 1000);
}
 

function getCurrentAsynMark() {
	var commentsDoc =$("iframe[src*='disqus.com/embed/comments/']").contents();
	if (commentsDoc) {
		var postList = commentsDoc.find("#post-list")[0];
		if (postList) {
			return $(postList).find(".post").length;
		}
	}
	return null;
}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	console.log(shouldLoadMore(loadMoreEle, displayEle));

	if (shouldLoadMore(loadMoreEle, displayEle)) {
		if (loadCount < 4) {

			asynMark = getCurrentAsynMark();
			clickNode(loadMoreEle);

			loadCount ++;

		} else {
			var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		sendRequest(requestObj);
	}
} 
