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
		var commentEle = document.getElementById('vanilla-comments');

		if (checkByEle(commentEle)) {
			scrollToElement(commentEle);
			clearInterval(commentEleCheckIntervalId);

			setTimeout(function() {
				var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

					if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
						
						var loadMoreEle = document.querySelector("iframe[src*='politicalbetting.vanillaforums.com//index.php']").contentDocument.querySelector("#PagerMore a");

						operationOnLoadMoreComments(loadMoreEle, null, operationOnLoadMoreCommentsIntervalId);
					};

				}, 1000);
			}, 3000);
		}

	}, 1000);
}
 

function getCurrentAsynMark() {
	var commentsDoc = document.querySelector("iframe[src*='politicalbetting.vanillaforums.com//index.php']").contentDocument;
	if (commentsDoc) {
		var postList = commentsDoc.getElementsByClassName("DataList MessageList Comments");
		if (postList) {
			return postList[0].getElementsByClassName("Item ItemComment").length
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
			var commentsDoc = document.querySelector("iframe[src*='politicalbetting.vanillaforums.com//index.php']");
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		var commentsDoc = document.querySelector("iframe[src*='politicalbetting.vanillaforums.com//index.php']");
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		sendRequest(requestObj);
	}
}
