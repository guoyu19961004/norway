var pageNum = 0;

function shouldProcessState() {
	var nextPage = $("a[name*=BV_TrackingTag_Review_Display_NextPage]");
	console.debug(nextPage[0]);
	if (nextPage.length == 0) {
		return false;
	} else {
		return true;
	}
}

function fireStateEvent() {
	var firstIdBeforeClick = $("div[id*=BVRRDisplayContentReviewID]");
	var element = $("a[name*=BV_TrackingTag_Review_Display_NextPage]")[0];
	if (element) {
		element.click();

		setTimeout(function() {
			var nextPageIntervalId = setInterval(function() {
				var firstIdAfterClick = $("div[id*=BVRRDisplayContentReviewID]");
				if (firstIdBeforeClick != firstIdAfterClick) {
					clearInterval(nextPageIntervalId);
					scrollToComment();
				};
			},100);
		},1000);
	} else {
		scrollToComment();
	}
}

function doOperationOnState() {
	
	var links = $("link[rel=stylesheet]")[0].href;
	var requestObject = {
		links : links,
		response : getSerializedDoc(),
		pages : pageNum,
		isLast : false
	};
	if (shouldProcessState()) {
		chrome.extension.sendRequest(requestObject);
		setTimeout('fireStateEvent()', 1000);
		pageNum ++;
	} else {
		requestObject.isLast = true;
		chrome.extension.sendRequest(requestObject);
	}
}

function scrollToComment() {
	var element = $("#ankProdReviews")[0];
	if(element != null) {
		var actualTop = element.offsetTop;
		scroll(0, actualTop);
	}
	setTimeout('doOperationOnState()', 1000);
}


function getSerializedDoc() {
	var serializer = new XMLSerializer();
	var xml = serializer.serializeToString(document);
	return xml;
}

function scrollToPosts() {
	var element = $("#rightRail")[0];
	if (element != null) {
		var actualTop = element.offsetTop;
		scroll(0, actualTop);
	}
	setTimeout('operationOnState()', 1000);
}

function operationOnState() {
	
	var links = $("a[href]")[0].href;
	var requestObject = {
		links : links,
		response : getSerializedDoc(),
		pages : pageNum,
		isLast : false
	};
	if (processState()) {
		chrome.extension.sendRequest(requestObject);
		pageNum ++;
		setTimeout('fireEvent()', 1000);
	} else {
		requestObject.isLast = true;
		chrome.extension.sendRequest(requestObject);
	}
}

function fireEvent() {
	var firstIdBeforeClick = $(".phoneImg")[0].id;
	var nextPage = $(".nextLink")[0];
	nextPage.click();
	var nextPageIntervalId = setInterval(function() {
		var firstIdAfterClick = $(".phoneImg")[0].id;
		/*console.debug(firstIdBeforeClick + "---" + firstIdAfterClick);*/
		if (firstIdBeforeClick != firstIdAfterClick) {
			operationOnState();
			clearInterval(nextPageIntervalId);
		};
	}, 100);
}

function processState() {
	var nextPage = $(".nextLink");
	if (nextPage.length != 0) {
		var display = nextPage[0].style.display;
		if (display != "none") {
			return true;
		}
	}
	return false;
}

setTimeout(function() {
	var readyStateCheckIntervalId = setInterval(function() {
		if(document.readyState == "interactive"||document.readyState == "complete") {
			var commentTab = $("#cpwProdReviewsTab");
			if (commentTab.length > 0) {
				setTimeout('scrollToComment()', 1000);
			} else {
				setTimeout('scrollToPosts()', 1000);
			}
			clearInterval(readyStateCheckIntervalId);
		}

	},1000);
}, 3000);