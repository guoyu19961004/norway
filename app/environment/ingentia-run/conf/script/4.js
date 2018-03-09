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

  var commentEleCheckIntervalId = setInterval(function() {
      var commentsCountNode = $("li.comments span")[1];
      if ($(commentsCountNode).text().length > 0) {
      
            clearInterval(commentEleCheckIntervalId);
            scrollToElement(commentsCountNode);
            setTimeout(function() {
            
                    if(isNoComment()){
                    
                              console.log("comments number is 0");
                              var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
                              sendRequest(requestObj);
                    
                            }else{
                    
                              console.log("comments number is not 0");
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
                                                      }
                                          if(counter >= 5) {
                                                        counter = 0;
                                                        asynMark = asynMark + 1;
                                                      } else {
                                                        counter ++;
                                                      }
                              
                                        }, 1000);
                                    }
            
            
                  }, 3000);
          }
    }, 3000);
}

function isNoComment(){

    var commentsCountNode = $("li.comments span")[1];
    if(commentsCountNode){
          return Number($(commentsCountNode).text()) === 0;
    
        }
}

function getTheNodeForLoadMore(){
  var showComments = $(".unhideShowCommentsButton")[0];
  var showMoreComments = $(".fyre-stream-more-container")[0];
  if(showComments.textContent == "Show Comments"){
      return showComments;
    }else if(showMoreComments.textContent == "Show More Comments"){
      return showMoreComments;
    }else{
      return null;
    }
}


function getCurrentAsynMark() {
  return $('.fyre-stream-content').find("article[data-message-id]").length;
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

