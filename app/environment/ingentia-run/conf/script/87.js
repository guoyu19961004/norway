var pageNum = 0;
var loadCount = 0;
var asynMark = null;
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
  var docUrl = window.location.href;
  if(docUrl==="http://www.toutiao.com/news_tech/") {
    var operationOnLoadMorePostsIntervalId =  setInterval(function() {
      var numberOfPost = $(".wcommonFeed ul li").length;
      console.log("There are "+numberOfPost+" posts' link loaded.");
      operationOnLoadMorePosts(numberOfPost, operationOnLoadMorePostsIntervalId);
    }, 1000);
  } else{
    var commentEleCheckIntervalId = setInterval(function() {
      var commentsCountNode = $("#comment")[0];
      if ($(commentsCountNode).text().length > 0) {

        clearInterval(commentEleCheckIntervalId);
        scrollToElement(commentsCountNode);
        var count = 0;
        setTimeout(function() {
          var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
            $("span[ga_event*=click_expand_reply]").each(function() {
              $(this)[0].click();
            });

            if (checkByAsynMarkValue(asynMark, getCurrentAsynMark()) || count >=5 ) {
              var loadMoreEle = $("div.c-load-more")[0];
              scrollToElement(loadMoreEle);
              operationOnLoadMoreComments(loadMoreEle, null, operationOnLoadMoreCommentsIntervalId);
              count = 0;
            } else {
              count ++;
            }
          }, 1000);

        }, 3000);
      }
    }, 3000);
  }
}

function getCurrentAsynMark() {
  return $('#comment').find("ul li.c-item").length;
}

function operationOnLoadMorePosts(numberOfPost, operationOnLoadMorePostsIntervalId) {
  console.log(pageNum);
  console.log(loadCount);

  if (numberOfPost < 500) {
    if (loadCount < 5*(pageNum + 1) && loadCount < 15) {

      window.scrollTo(0,document.body.scrollHeight);
      loadCount ++;

    } else {
      var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
      sendRequest(requestObj);
      pageNum ++;
      loadCount = 0;
    }

  } else {
    clearInterval(operationOnLoadMorePostsIntervalId);
    var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
    sendRequest(requestObj);
  }
}


function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
  console.log(pageNum);
  console.log(loadCount);
  console.debug(shouldLoadMore(loadMoreEle, displayEle));

  if (shouldLoadMore(loadMoreEle, displayEle)) {
    if (loadCount < 5) {

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

