var pageNum = 0;
var loadCount = 0;
var asynMark = null;
var timeForLoad = 4;
var timeForWaitDisqus = 0;
setTimeout(function() {
	var readyStateCheckIntervalId = setInterval(function() {
		if (isPageLoaded()) {
			console.log("ready");
			clearInterval(readyStateCheckIntervalId);
			setTimeout(function() {
				checkIfContainComment();
			},2000);
		}

	}, 1000);

}, 2000);


function checkIfContainComment() {
	console.log("Check if contains any comment");
	var postNode = $("div[id^='post-']")[0];
	var commentNode = $(postNode).find("span.meta-comments.metric.info-right")[0];
	if (checkByEle(commentNode)){
		scrollToElement(commentNode);
		commentNode.click();
		onPageReady()
	} else{
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}
}


function onPageReady() {
	console.log("onPageReady");

	var commentEleCheckIntervalId = setInterval(function() {
		loadCount ++;
		var commentEle = $("#disqus_thread")[0];

		if (checkByEle(commentEle)) {
			var commentsLoadStatus = $("iframe[src*='disqus.com/embed/comments/']").contents().find("#post-list")[0].className;
			console.log(commentsLoadStatus);
			if(commentsLoadStatus.indexOf("loading") > 1 && loadCount > 10){
				var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
				var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
				sendRequest(requestObj);
				pageNum ++;
				loadCount=0;
			}
			if (commentsLoadStatus.indexOf("loading") == -1) {
				clearInterval(commentEleCheckIntervalId);
				setTimeout(function() {
					loadCount = 0;
					var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

						if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {

							var loadMoreEle = $("iframe[src*='disqus.com/embed/comments/']").contents().find("a[data-action=more-posts]")[0];

							if (loadMoreEle) {
								var displayEle = loadMoreEle.parentElement;

								operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
							}
						}

					}, 800);
				}, 2000);
			}
		}
	}, 500);
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
		if (loadCount < timeForLoad && loadCount < 22) {

			asynMark = getCurrentAsynMark();
			clickNode(loadMoreEle);

			loadCount ++;

		} else {
			var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			timeForLoad += 7;
			loadCount=0;
		}

	} else {
		var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		sendRequest(requestObj);
	}
}

function waitForDisqus(n) {
	if(n<22){
		var requestObj =  createRequestObject(0, null, false, getSerializedDoc());
		sendRequest(requestObj);
		timeForWaitDisqus ++;
	} else{
		var requestObj =  createRequestObject(100, null, true, getSerializedDoc());
		sendRequest(requestObj);
	}
}
