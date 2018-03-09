var pageNum = 0;


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

  scrollToBottom();
    var operationOnLoadMoreCommentsIntervalId = setInterval(function () {
            var commentNode = $("#SOHUCS")[0];
            if(commentNode) {
                        clearInterval(operationOnLoadMoreCommentsIntervalId);
                        var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
                    sendRequest(requestObj);
                    }
        }, 1000);
}

