var pageNum = 0;
var loadCount = 0;
var asynMark = null;

$(function() {
	console.log("ready");
	setTimeout("onPageReady()", 5000);
});

function onPageReady() {
	console.log("onPageReady");
	scrollToBottom();
	setTimeout(function() {
		var mark = $('section[itemprop="articleBody"]')[0];
		
		if (mark) {
			var scrollEle = $("#disqus_thread")[0];
			scrollToElement(scrollEle);

			var commentEleCheckIntervalId = setInterval(function() {
				var commentEle = $("#disqus_thread")[0];

				if (checkByEle(commentEle)) {
					clearInterval(commentEleCheckIntervalId);

					setTimeout(function() {
						var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
							
							if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
								var loadMoreEle =  $("#dsq-2").contents().find("a[data-action=more-posts]")[0];
								setTimeout(function() {
									if (loadMoreEle) {
										var displayEle = loadMoreEle.parentElement;
										operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
									};
								}, 5000);
							};

						}, 1000);
					}, 3000);
				}

			}, 1000);

		} else {
			
			var scrollEle = $("#feed-loader-prompt")[0];
			scrollToElement(scrollEle);

			setTimeout(function() {
				var operationOnLoadMorePostsIntervalId =  setInterval(function() {

					if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
						var loadMoreEle = $("#feed-loader-prompt")[0];
						
						operationOnLoadMorePosts(loadMoreEle, null, operationOnLoadMorePostsIntervalId);
					}
				}, 1000);

			}, 3000);
		}
	}, 5000);
}

function getCurrentAsynMark() {
	var mark = $('section[itemprop="articleBody"]')[0];

	var blogAsynMark = $("article[ng-class='article.tagClasses']").length;
	var commentAsynMark = $('#dsq-2').contents().find('#post-list .post').length;
	
	if (mark) {
		return commentAsynMark;
	} else {
		return blogAsynMark;
	}
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
			var commentsDoc = $('#dsq-2')[0];
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		var commentsDoc = $('#dsq-2')[0];
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		sendRequest(requestObj);
	}
}

function operationOnLoadMorePosts(loadMoreEle, displayEle, operationOnLoadMorePostsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);

	if (pageNum < 5) {
		if (loadCount < 4) {
			
			scrollToBottom();
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
		clearInterval(operationOnLoadMorePostsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}

}
