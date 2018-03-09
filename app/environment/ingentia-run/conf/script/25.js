var pageNum = 0;
var loadCount = 0;
var asynMark = null;
var timeForLoad = 4;
setTimeout(function() {
	var readyStateCheckIntervalId = setInterval(function() {
		if (isPageLoaded()) {
			console.log("ready");
			clearInterval(readyStateCheckIntervalId);
			scrollToBottom();
			setTimeout(function() {
				onPageReady();
			},2000);
		};

	}, 1000);

}, 2000);

function onPageReady() {
	console.log("onPageReady");

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $("#disqus_thread")[0];
		if (isEleEmpty(commentEle)) {
			scrollToElement(commentEle);
			var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
			sendRequest(requestObj);
		}

		var NodeofCounter = $("iframe[src*='disqus.com/embed/comments/']").contents().find("span[class='comment-count']")[0];
		if(NodeofCounter != null){
			if(parseInt(NodeofCounter.innerText) == 0){
				console.log("no comment here.");
				operationOnLoadMoreComments(false, false, commentEleCheckIntervalId);
			}
		}
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
							};
						};

					}, 2000);
				}, 3000);
			}
		} else {

			var disabledCommInf = $("#commenting_links > li").text();
			var closedCommInf = $("span[class=post-comments] > span").text();
			if(disabledCommInf.indexOf("disabled") != -1 || closedCommInf.indexOf("關閉") != -1) {
				clearInterval(commentEleCheckIntervalId);
				var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
				sendRequest(requestObj);
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
		};
	};
	return null;
}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	console.log(shouldLoadMore(loadMoreEle, displayEle));

	if (shouldLoadMore(loadMoreEle, displayEle)) {
		if (loadCount < timeForLoad && loadCount < 20) {

			asynMark = getCurrentAsynMark();
			clickNode(loadMoreEle);

			loadCount ++;

		} else {
			var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			timeForLoad += 6;
			loadCount=0;
		}

	} else {

		var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		sendRequest(requestObj);
	}
}

function isEleEmpty(ele) {
	if(!(ele)) {
		return true;
	}
	if(ele && $(ele).html().trim().length == 0 && $(ele).children().length == 0) {
		return true;
	}
	return false;
}
