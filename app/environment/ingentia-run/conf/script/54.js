var pageNum = 0;
var loadCount = 0;
var asynMark = null;
setTimeout(function () {
    var readyStateCheckIntervalId = setInterval(function () {
        if (isPageLoaded()) {
            console.log("ready");
            clearInterval(readyStateCheckIntervalId);
            onPageReady();
        }
    }, 1000);
}, 2000);

function onPageReady() {
    console.log("onPageReady");

    var new_comment_mark = $("#hdn-vf-comments");
    if(new_comment_mark.length ) {

        var commentEle = new_comment_mark[0];

        scrollToElement(commentEle);

        commentsLoadInterval = setInterval(function() {
            commentsContainer = $(".vf-commenting>.vf-horizontal-list");
            if(checkByEle(commentsContainer[0])) {
                clearInterval(commentsLoadInterval);
                var operationOnLoadMoreCommentsIntervalId = setInterval(function () {
                    if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {

                        var showMoreComments = getShowMoreCommentsEle();
                        var showMoreReplies = getShowMoreReliesEle();
                        var loadMoreEle = showMoreComments || showMoreReplies;

                        operationOnLoadMoreComments(loadMoreEle, null, operationOnLoadMoreCommentsIntervalId);
                    }
                }, 1000);
            }
        }, 1000);
    } else {
        console.log("closing");
        requestObj = createRequestObject(pageNum, null, true, getSerializedDoc());
        sendRequest(requestObj);
    }
}

function getShowMoreReliesEle() {
    var showMoreReplies = $(".vf-comment-replies:not(.hidden) a")[0];
    return showMoreReplies;
}

function getShowMoreCommentsEle() {
    var showMoreComments = null;
    var displayEle = $(".vf-load-more-con")[0];
    if(displayEle.style.display != 'none') {
        showMoreComments = $(displayEle).find("a")[0];
    }
    return showMoreComments
}

function getCurrentAsynMark() {
    return $('.vf-commenting .vf-comment-container').length;

}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
    console.log(pageNum);
    console.log(loadCount);
    console.debug(shouldLoadMore(loadMoreEle, displayEle));

    if (shouldLoadMore(loadMoreEle, displayEle)) {
        if (loadCount < 4) {

            asynMark = getCurrentAsynMark();
            clickNode(loadMoreEle);

            loadCount++;

        } else {

            var requestObj = createRequestObject(pageNum, null, false, getSerializedDoc());
            sendRequest(requestObj);
            pageNum++;
            loadCount = 0;
        }

    } else {

        clearInterval(operationOnLoadMoreCommentsIntervalId);
        requestObj = createRequestObject(pageNum, null, true, getSerializedDoc());
        sendRequest(requestObj);
    }
}
