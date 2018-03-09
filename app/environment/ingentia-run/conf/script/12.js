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
	var clickNode = $(".util-bar-btn.util-bar-btn-comments")[0];
	var scroll = $("div.shares_order .fb_share")[0] || $("div.sharePanel.sharify.adAvoided")[0];
	if(clickNode) {
		clickNode.click();
	}else if (scroll) {
		scrollToElement(scroll);
	}

	var commentEleCheckIntervalId = setInterval(function() {

		var commentEle = $("iframe[src*='www.facebook.com/plugins/comments']")[0];

		console.log($("iframe[src*='www.facebook.com/plugins/comments']")[0]);
		if (checkByEle(commentEle)) {
			clearInterval(commentEleCheckIntervalId);

			var scrollEle = $("iframe[src*='www.facebook.com/plugins/comments']")[0];

			scrollToElement(scrollEle);

			setTimeout(function() {
				var count = 0;
				var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

					if (checkByAsynMarkValue(asynMark, getCurrentAsynMark(count))) {

						console.log($("iframe[src*='www.facebook.com/plugins/comments']").contents()
							.find("button._1gl3._4jy0._4jy3._517h._51sy._42ft").length);

						var loadMoreComments = $("iframe[src*='www.facebook.com/plugins/comments']").contents()
							.find("button._1gl3._4jy0._4jy3._517h._51sy._42ft")[0];

						var loadMoreReplies = $("iframe[src*='www.facebook.com/plugins/comments']").contents()
						.find("span._50f3._50f7")[0];


						var loadMoreEle = loadMoreReplies || loadMoreComments;

						operationOnLoadMoreComments(loadMoreEle, operationOnLoadMoreCommentsIntervalId);
						count = 0;
					};
					count ++;
				}, 3000);
			}, 3000);
		}

	}, 1000);
}


function getCurrentAsynMark(count) {
	var commentsDoc = $("iframe[src*='www.facebook.com/plugins/comments']").contents();
	if (commentsDoc.length) {
		length = commentsDoc.find("._3-8y").length;
		if (count > 2) {
			length += 1;
		};
		return length;
	};
	return null;
}

function operationOnLoadMoreComments(loadMoreEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	console.log("If loadmore is "+checkByEle(loadMoreEle));

	if (loadMoreEle) {
		if (loadCount < 4) {

			asynMark = getCurrentAsynMark(0);
			scrollToElement(loadMoreEle);
			clickNode(loadMoreEle);

			loadCount ++;

		} else {
			var commentsDoc = $("iframe[src*='www.facebook.com/plugins/comments']")[0];
			var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
			sendRequest(requestObj);
			pageNum ++;
			loadCount = 0;
		}

	} else {
		var commentsDoc = $("iframe[src*='www.facebook.com/plugins/comments']")[0];
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		sendRequest(requestObj);
	}
}
