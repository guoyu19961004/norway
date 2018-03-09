var pageNum = 0;
var loadCount = 0;
var isnewestSelected = false;

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

	var scrollEle = $('div[class=details-section-heading]')[0];
	
	scrollToElement(scrollEle);

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $(".preview-reviews.multicol")[0];

		if (checkByEle(commentEle)) {
			clearInterval(commentEleCheckIntervalId);

			var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

				var loadMoreEle = $('.details-section.reviews .expand-button.expand-next')[0];
				if (loadMoreEle) {
					if(isnewestSelected) {
						console.debug(loadMoreEle);
				
						var displayEle = loadMoreEle;
							
						operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);

					} else {
						selectNewest();
					}
				}
			}, 3000);
		}

	}, 1000);
}
 
 function selectNewest() {
 	console.log("selectNewest");
 	var newest = $(".dropdown-child")[0];
 	if (newest) {
 		newest.click();
 		isnewestSelected = true;
 	} else {
 		setTimeout('selectNewest()', 1000);
 	}
 }

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
	console.log(pageNum);
	console.log(loadCount);
	console.debug(shouldLoadMore(loadMoreEle, displayEle));	

	if (shouldLoadMore(loadMoreEle, displayEle) && pageNum < 10) {
		if (loadCount < 4) {

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


