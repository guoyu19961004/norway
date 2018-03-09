var pageNum = 0;
var loadCount = 0;
var asynMark = null;

var readyStateCheckIntervalId = setInterval(function() {
	if (isPageLoaded()) {
		clearInterval(readyStateCheckIntervalId);

		onPageReady();
	};

}, 1000);

function onPageReady() {
	if($(".dsq-postid").text() == "No Comments") {
		console.log("No Comments");
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}

	var mark = $("#disqus_thread")[0];

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
		
		var scrollEle = $("#primary_more")[0];
		scrollToElement(scrollEle);

		setTimeout(function() {
			var operationOnLoadMorePostsIntervalId =  setInterval(function() {

				if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
					var loadMoreEle = $("#primary_more")[0];
					
					operationOnLoadMorePosts(loadMoreEle, null, operationOnLoadMorePostsIntervalId);
				}
				("#disqus_thread")
			}, 1000);

		}, 3000);
	}
}

function getCurrentAsynMark() {
	var mark = $("#disqus_thread")[0];

	var blogAsynMark = $(".post_title").length;
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

	if (pageNum < 10) {
		if (loadCount < 4) {
			
			scrollToBottom();
			asynMark = getCurrentAsynMark();

			loadCount ++;

		} else {
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		/*console.log(dumpArgus.data);*/
		clearInterval(operationOnLoadMorePostsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}

}
