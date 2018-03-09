var pageNum = 0;
var loadCount = 0;
var asynMark = null;
var timeForLoad = 4;
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
      var commentsCountNode = $(".commentCountNumber")[0];
      if ($(commentsCountNode).text().length > 0) {
      
            clearInterval(commentEleCheckIntervalId);
            scrollToElement(commentsCountNode);
            setTimeout(function() {
            
                    if(isNoComment()){
                    
                              console.log("comments number is 0");
                              var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
                              sendRequest(requestObj);
                    
                            }else{
                    
                              console.log("comments number is more than 0");
                              var counter = 0;
                              var theNumOfSpanToscroll = 0;
                              var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
                              
                                          if (checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {
                                          
                                                        var loadMoreEle = getTheNodeForLoadMore();
                                                        console.log("loadMoreEle is "+loadMoreEle);
                                                        scrollToElement(loadMoreEle);
                                                        if (loadMoreEle) {
                                                        
                                                                        var displayEle = loadMoreEle.parentElement;
                                                        
                                                                        operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId);
                                                                      }
                                                      }else if (counter >= 5) {
                                                        counter = 0;
                                                        asynMark = asynMark + 1;
                                                      } else {
                                                        counter ++;
                                                      }
                              
                                        }, 1000);
                                    }
            
            
                  }, 3000);
          }
    }, 1000);
}

function isNoComment(){

    var commentsCountNode = $(".commentCountNumber")[0];
    if(commentsCountNode){
          return Number($(commentsCountNode).text().replace(/\D/g, '')) === 0;
    
        }
}

function getTheNodeForLoadMore(){
  var showComments = $(".showComments")[0];
  var showMoreComments = $(".fyre-stream-more-container")[0];
  if(showMoreComments){
      return showMoreComments;
    }else{
      return showComments;
    }
}


function getCurrentAsynMark() {
  return $('.fyre-stream-content').find("article[data-message-id]").length;
}

function forceStop() {
  var LoadErrorWarningNode = $(".fyre-modal-alert-content")[0];
  return checkByEle(LoadErrorWarningNode);

}

function operationOnLoadMoreComments(loadMoreEle, displayEle, operationOnLoadMoreCommentsIntervalId) {
  console.log(pageNum);
  console.log(loadCount);
  console.debug(shouldLoadMore(loadMoreEle, displayEle));

  if (shouldLoadMore(loadMoreEle, displayEle) && !forceStop()) {
      if (loadCount < timeForLoad && loadCount < 22) {
      
            asynMark = getCurrentAsynMark();
            clickNode(loadMoreEle);
      
            loadCount ++;
      
          } else {
      
            var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
            sendRequest(requestObj);
            pageNum ++;
            timeForLoad += 7;
            loadCount=0;
          }
  
    } else {
  
      clearInterval(operationOnLoadMoreCommentsIntervalId);
      var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
      sendRequest(requestObj);
    }
}

