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

    var commentEleCheckIntervalId = setInterval(function () {
        var commentEle = $(".button.comments__show")[0];

        if (commentEle) {
            clearInterval(commentEleCheckIntervalId);

            scrollToElement(commentEle);

            setTimeout(function () {
                var counter = 0;
                var operationOnLoadMoreCommentsIntervalId = setInterval(function () {

                    if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {

                        var loadMoreEle = $(".button.comments__show")[0];

                        operationOnLoadMoreComments(loadMoreEle, null, operationOnLoadMoreCommentsIntervalId);
                    }
                    if (counter >= 5) {
                        counter = 0;
                        asynMark = asynMark + 1;
                    } else {
                        counter++;
                    }
                }, 1000)
            }, 3000);
        }else{
          operationOnLoadMoreComments(false, null, 0);
        }
    }, 1000);
}


function getCurrentAsynMark() {
    return $(".comments__list .comment").length;

}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
    console.log(pageNum);
    console.log(loadCount);
    console.log(shouldLoadMore(loadMoreEle, displayEle));
    if (shouldLoadMore(loadMoreEle, displayEle)) {
        if (loadCount < 8) {

            asynMark = getCurrentAsynMark();
            clickNode(loadMoreEle);

            loadCount++;

        } else {

            var requestObj = createRequestObject(pageNum, null, false, getSerializedDoc());
            sendRequest(requestObj);
            loadCount = 0;
        }

    } else {
        pageNum++;
        clearInterval(operationOnLoadMoreCommentsIntervalId);
        var requestObj = createRequestObject(pageNum, null, true, getSerializedDoc());
        sendRequest(requestObj);
    }
}
