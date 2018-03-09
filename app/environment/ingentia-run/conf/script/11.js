var pageNum = 0;
var loadCount = 0;
var asynMark = null;
var footerOffSet = 0;

setTimeout(function() {
	var readyStateCheckIntervalId = setInterval(function() {
		if (isPageLoaded()) {
			console.log("ready");
			clearInterval(readyStateCheckIntervalId);

			onPageReady();
		}

	}, 1000);

}, 2000);

function onPageReady() {
	console.log("onPageReady");

	var commentEleCheckIntervalId = setInterval(function() {
		var commentEle = $('.js_replies ')[0];
		if (commentEle) {
			clearInterval(commentEleCheckIntervalId);
			scrollToElement(commentEle);

            var scrollIntervalId = setInterval(function() {

                var viewall = $(".js_allview")[0];
                if(viewall && viewall.className.indexOf("active") == -1) {
                    clickNode(viewall);
                } else {
                    var currentFooterOffSet = $(".site-footer")[0].offsetTop;
                    if(currentFooterOffSet != footerOffSet) {
                        scrollToBottom();
                        footerOffSet = currentFooterOffSet;
                    } else {
                        clearInterval(scrollIntervalId);
                        setTimeout('loadMore()', 1000);
                    }
                }
            }, 1000);
		}
	}, 1000);
}

function loadMore() {
    var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
        scrollToBottom();

        if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {

            var loadpending = $(".load-pending a.js_load-pending-btn")[0];
            var showmore = null;
            var showmoreEles = $("footer.reply-footer-bar a.js_load-all-replies");
            for(i=0; i<showmoreEles.length; i++){
                if(!($(showmoreEles[i]).is(":hidden"))){
                    showmore = showmoreEles[i];
                    break;
                }
            }
            var loadMoreEle = null;
            if(loadpending && loadpending.parentElement.className.indexOf("hide") == -1) {
                loadMoreEle = loadpending;
            } else {
                loadMoreEle = showmore;
            }
            operationOnLoadMoreComments(loadMoreEle, null, operationOnLoadMoreCommentsIntervalId);
        }
    }, 1000);
}

function getCurrentAsynMark() {
	return $('article.js_reply').length;

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
