var pageNum = 0;
var loadCount = 0;
var asynMark = null;
var timeForLoad = 4;
var indexOfExpand = 0;
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
    var commentEle = $('#comments')[0];

    if (commentEle) {
      clearInterval(commentEleCheckIntervalId);

      scrollToElement(commentEle);
      setTimeout(function() {
        var counter = 0;
        var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {

          var seeMoreExpand = $(".b-leaf-seemore-expand a")[0];
          if(checkByEle(seeMoreExpand)){
            seeMoreExpand.click();
          }

          if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
            console.log("indexOfExpand is "+indexOfExpand);

            var loadMoreEle = $(".b-leaf-actions .b-leaf-actions-expandchilds .b-pseudo")[indexOfExpand];

            operationOnLoadMoreComments(loadMoreEle, null, operationOnLoadMoreCommentsIntervalId);
          }
          if(counter >= 5) {
            counter = 0;
            indexOfExpand ++;
            asynMark = asynMark + 1;
          } else {
            counter ++;
          }
        }, 1000);
      }, 3000);
    }
  }, 1000);
}


function getCurrentAsynMark() {
  return $('.b-leaf.comment.p-comment').find(".b-leaf-article").length;

}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
  console.log(pageNum);
  console.log(loadCount);
  console.debug(loadMoreEle);

  if (shouldLoadMore(loadMoreEle, displayEle)) {
    if (loadCount < timeForLoad && loadCount < 17) {

      asynMark = getCurrentAsynMark();
      clickNode(loadMoreEle);

      loadCount ++;

    } else {

      var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
      sendRequest(requestObj);
      pageNum ++;
      timeForLoad += 6;
      loadCount = 0;
    }

  } else {

    clearInterval(operationOnLoadMoreCommentsIntervalId);
    var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
    sendRequest(requestObj);
  }
}

