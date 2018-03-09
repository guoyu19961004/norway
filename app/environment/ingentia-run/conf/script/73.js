var pageNum = 0;
var loadCount = 0;
var asynMark = null;
var NumberOfComments = null;
var secondWaitCauseByNodeNotChange = 0;
var timeForLoad = 4;
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
		var commentEle = $("#disqus_thread")[0];
		if (isEleEmpty(commentEle)) {
			scrollToElement(commentEle);
			var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
			sendRequest(requestObj);
		}

		if (checkByEle(commentEle)) {

			var commentsLoadStatus = $("iframe[src*='disqus.com/embed/comments/']").contents().find("#post-list")[0].className;
			console.log(commentsLoadStatus);
			if (commentsLoadStatus.indexOf("loading") == -1) {
				clearInterval(commentEleCheckIntervalId);
				setTimeout(function() {
					var counter = 0;
					var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
						if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
							counter = 0;
							var loadMoreEle = $("iframe[src*='disqus.com/embed/comments/']").contents().find("a[data-action=more-posts]")[0];
							if (loadMoreEle) {
								var displayEle = loadMoreEle.parentElement;
								setTimeout(function(){
									operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
								}, 1200);
							};
						};
/*counter add 1 while the comment still loading for 1 second;
while counter larger than 5,asynMark add 1,to check if loadMoreEle is true;*/
						if (counter >= 5) {
								counter = 0;
								asynMark = asynMark + 1;
						} else {
								counter ++;
						};
/*while some page with lots of comments(such as 2000+),all of the comment are loaded,but the loadMoreEle still true;
To make sure this js can stop,secondWaitCauseByNodeNotChange will add 1 when the comments' number not change every time;while secondWaitCauseByNodeNotChange more than 60,this js will stop;*/
						if (checkByAsynMarkValue(NumberOfComments, getCurrentAsynMark())) {
							secondWaitCauseByNodeNotChange = 0;
						}else if (secondWaitCauseByNodeNotChange < 70) {
							secondWaitCauseByNodeNotChange ++;
							console.log("The number of comments have not chenged for "+secondWaitCauseByNodeNotChange+" seconds! Will stop at 61.");
						}else{
							var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
							clearInterval(operationOnLoadMoreCommentsIntervalId);
							var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
							sendRequest(requestObj);
						};
					}, 1000);
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
		if (loadCount < timeForLoad && loadCount < 22) {
			NumberOfComments = getCurrentAsynMark();
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

function isEleEmpty(ele) {
	if(!(ele)) {
		return true;
	}
	if(ele && $(ele).html().trim().length == 0 && $(ele).children().length == 0) {
		return true;
	}
	return false;
}
 
