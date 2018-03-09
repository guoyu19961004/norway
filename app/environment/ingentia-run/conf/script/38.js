var pageNum = 0;
var loadCount = 0;
var viewallEle = null;
var asynMark = null;
var isSend = false;

var readyStateCheckIntervalId = setInterval(function() {

	if(isPageLoaded()){
		console.log("ready");
		clearInterval(readyStateCheckIntervalId);
		onPageReady();
		
	}
}, 1000);


function onPageReady() {

		var scrollEle = $(".custom_tabs")[0]; 
		scrollToElement(scrollEle);

		var commentEleCheckIntervalId = setInterval(function() {
			var commentEle = $("#___comments_0")[0]; 
			if (checkByEle(commentEle)) {
				clearInterval(commentEleCheckIntervalId);
				var tab2 = $(".custom_tabs li a")[1];
				mouseEventClick(tab2);
				setTimeout(function() {

					var doOperationOnState1IntervalId = setInterval(function() {

						var loadMoreEle = $("iframe[src*='apis.google.com']").contents().find(".d-s.L5.r0")[0];
						if (loadMoreEle) {
							var displayEle = $("iframe[src*='apis.google.com']").contents().find(".R4.b2.Xha")[0];
							
							if(!(shouldLoadMore(loadMoreEle, displayEle)) && viewallEle == null) {
								
								var viewall =  $("iframe[src*='apis.google.com']").contents().find(".GK.HK.TC");
								viewallEle = new Array();
								for (var i = 0;i < viewall.length - 1; i++) {
									if(viewall[i].style.display != "none") {
										if (viewall[i].getElementsByClassName("d-s vy").length > 0) {

											viewallEle.push(viewall[i].getElementsByClassName("d-s vy")[0]);
										}
									}
								}
								
							}

							doOperationOnState1(loadMoreEle, displayEle, doOperationOnState1IntervalId);	
						}
					}, 3000);

				}, 3000);
			}
		}, 1000);
}

function onGplusComplete() {

	var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

		if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
			
			var loadMoreEle = $("iframe[src*='disqus.com/embed/comments/']").contents().find("a[data-action=more-posts]")[0];

			if (loadMoreEle) {
				var displayEle = loadMoreEle.parentElement;
				
				operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
			};
		};

	}, 1000);
}

function getCurrentAsynMark() {
	return $("iframe[src*='disqus.com/embed/comments/']").contents().find('#post-list .post').length;
}

function doOperationOnState1(loadMoreEle, displayEle, doOperationOnState1IntervalId) {
	console.log("pageNum: " + pageNum);
	console.log("loadCount:" + loadCount);

	if(shouldLoadMore(loadMoreEle, displayEle)) {
		
		loadMoreEle.click();
		
	} else {

		if(viewallEle && viewallEle.length > 0) {
			viewallEle.pop().click();

		} else {
			isSend =  true;
		}
		
	}

	if (isSend) {
		clearInterval(doOperationOnState1IntervalId);

		var iframeDoc = $("iframe[src*='apis.google.com']")[0];
		console.debug(iframeDoc);
		var serializedDom = getSerializedDocWithIframe(iframeDoc);
		var requestObj = createRequestObject(pageNum, null, true, getSerializedDocWithIframe(iframeDoc));
		sendRequest(requestObj);
		/*pageNum ++;
		onGplusComplete();*/
	};
}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
	console.log("pageNum: " + pageNum);
	console.log("loadCount:" + loadCount);


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
		clearInterval(operationOnLoadMoreCommentsIntervalId);
		var commentsDoc = $("iframe[src*='disqus.com/embed/comments/']")[0];
		var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
		
		sendRequest(requestObj);
	}
} 
