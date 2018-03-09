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

    var scrollEle = $('#comments')[0];
    
    scrollToElement(scrollEle);

    var commentEleCheckIntervalId = setInterval(function() {
        var commentEle = $(".comments .posts")[0];

        if (checkByEle(commentEle)) {
            clearInterval(commentEleCheckIntervalId);
            var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

                if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
                    
                    var loadMoreEle = $("#morePosts")[0];
                    var displayEle = null;
                    if (loadMoreEle) {
                        displayEle = loadMoreEle;
                    };
                    operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
                };

            }, 1000);
        }

    }, 1000);
}
 

function getCurrentAsynMark() {
    return $(".comments .posts li").length;
    
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


