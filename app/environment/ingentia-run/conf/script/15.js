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

	var mark = $(".article-comments");
	if (mark.length) {
		console.log("comment");
		var scrollEle = $(".article-comments")[0];
	
		scrollToElement(scrollEle);

		var commentEleCheckIntervalId = setInterval(function() {
			var commentEle = $('.fyre-stream-content')[0];

			if (commentEle) {
				clearInterval(commentEleCheckIntervalId);

				setTimeout(function() {
					var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

						if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
							
							var loadMoreEle = $(".fyre-stream-more-container")[0];

							if (loadMoreEle) {
								var displayEle = loadMoreEle.parentElement;
								
								operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
							};
						};

					}, 1000);
				}, 3000);
			}

		}, 1000);


	} else {

		var operationOnLoadMorePostsIntervalId =  setInterval(function() {

			operationOnLoadMorePosts(operationOnLoadMorePostsIntervalId);


		}, 1000);
	}
}
 

function getCurrentAsynMark() {
	var mark = $(".article-comments");
	var commentMark = $('.fyre-stream-content').find("article[data-message-id]").length;
	var postMark = $(".post.short").length;
	if (mark.length) {
		return commentMark;
	} else {
		return postMark;
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

function operationOnLoadMorePosts(operationOnLoadMorePostsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);

	var footOpacity = $("#site-footer-wrapper")[0].style.opacity;
	if (loadCount < 50 && footOpacity == '0') {
		if (loadCount % 5 != 0) {
			if(checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
				loadCount ++;
			};
			asynMark = getCurrentAsynMark();
			scrollToBottom();
			setTimeout(function() {
				scrollToTop();
			}, 500);
			
		} else {
			
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
			sendRequest(requestObj);
			pageNum ++;
			loadCount ++;
		}
		
	} else {
		clearInterval(operationOnLoadMorePostsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}

}
