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

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = document.getElementById('disqus_thread');

		if (commentEle != null) {
			scrollToElement(commentEle);
		} else {
			var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
			sendRequest(requestObj);
		}
		var disqusIframe = document.querySelector("iframe[src*='disqus.com/embed/comments/']").contentDocument;
		var commentIsLoading = disqusIframe.querySelector(".disqus-loader-spinner");
		if(commentIsLoading != null && loadCount > 10){
			console.log("test");
			var commentsDoc = document.querySelector("iframe[src*='disqus.com/embed/comments/']");
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}
		var NodeofCounter = disqusIframe.querySelector("span[class='comment-count']");
		if(NodeofCounter != null){
			if(parseInt(NodeofCounter.innerText) == 0){
				console.log("no comment here.");
				operationOnLoadMoreComments(false, false, commentEleCheckIntervalId);
			}
		}

		var commetNodeIsLoaded = disqusIframe.querySelector('#post-list').querySelectorAll("li.post").length;
		if (commetNodeIsLoaded > 0) {
			clearInterval(commentEleCheckIntervalId);
			console.log("Loaded the comments,gogogogogo");
			loadCount = 0;

			setTimeout(function() {
				var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

					if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {

						var loadMoreEle = disqusIframe.querySelector('[data-action="more-posts"]');
						if (loadMoreEle) {
							var displayEle = loadMoreEle.parentElement;
							operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
						};
					};

				}, 2000);
			}, 1000);
		}
		loadCount ++ ;
	}, 1000);
}


function getCurrentAsynMark() {
	var commentsDoc = document.querySelector("iframe[src*='disqus.com/embed/comments/']").contentDocument;
	if (commentsDoc) {
		var postList = commentsDoc.getElementById("post-list");
		if (postList) {
			return postList.getElementsByClassName("post").length
		};
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
			clickNode(loadMoreEle);

			loadCount ++;

		} else {
			var commentsDoc = document.querySelector("iframe[src*='disqus.com/embed/comments/']");
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		var commentsDoc = document.querySelector("iframe[src*='disqus.com/embed/comments/']");
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		sendRequest(requestObj);
	}
}
