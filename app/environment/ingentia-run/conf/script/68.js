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

  var scroll = $(".more_shares.bf_dom")[0];
  if (scroll) {
      scrollToElement(scroll);
    }
  var waitforFacebook = 0;
  setTimeout(function(){
      var commentEleCheckIntervalId = setInterval(function() {
      
            var facebookCommentEle = $("iframe[src*='www.facebook.com/plugins/comments']")[0];
      
            console.log($("iframe[src*='www.facebook.com/plugins/comments']")[0]);
            if (checkByEle(facebookCommentEle)) {
                    clearInterval(commentEleCheckIntervalId);
            
                    var scrollEle = $("iframe[src*='www.facebook.com/plugins/comments']")[0];
            
                    scrollToElement(scrollEle);
            
                    setTimeout(function() {
                              var count = 0;
                              var operationOnLoadMoreCommentsIntervalId =  setInterval(function() {
                              
                                          if (checkByAsynMarkValue(asynMark, getCurrentAsynMark(count))) {
                                          
                                                        console.log($("iframe[src*='www.facebook.com/plugins/comments']").contents()
                                                                        .find("button._1gl3._4jy0._4jy3._517h._51sy._42ft").length);
                                          
                                                        var loadMoreComments = $("iframe[src*='www.facebook.com/plugins/comments']").contents()
                                                          .find("button._1gl3._4jy0._4jy3._517h._51sy._42ft")[0];
                                          
                                                        var loadMoreReplies = $("iframe[src*='www.facebook.com/plugins/comments']").contents()
                                                        .find("span._50f3._50f7")[0];
                                          
                                                        if(checkByEle(loadMoreComments)){
                                                                        console.log("loadMoreComments is true");
                                                                        var loadMoreEle = loadMoreComments;
                                                                      } else if(checkByEle(loadMoreReplies)){
                                                                        console.log("loadMoreReplies is true");
                                                                        var loadMoreEle = loadMoreReplies;
                                                                      }else
                                                        var loadMoreEle = loadMoreReplies;
                                                        console.log("loadMoreReplies is false");
                                                        operationOnLoadMoreComments(loadMoreEle, operationOnLoadMoreCommentsIntervalId);
                                                        count = 0;
                                                      };
                                          count ++;
                                        }, 2000);
                            }, 3000);
                  }else{
                    waitforFacebook ++;
                    console.log("waitforFacebook is "+waitforFacebook);
                    if(waitforFacebook > 5){
                              scrollToBottom();
                              setTimeout(function() {
                                          var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
                                          sendRequest(requestObj);
                                        }, 3000);
                            }
                        }
      
          }, 3000);
    },2000);

}


function getCurrentAsynMark(count) {
  var commentsDoc = $("iframe[src*='www.facebook.com/plugins/comments']").contents();
  if (commentsDoc.length) {
      length = commentsDoc.find("._3-8y").length;
      if (count > 2) {
            length += 1;
          };
      return length;
    };
  return null;
}

function operationOnLoadMoreComments(loadMoreEle, operationOnLoadMoreCommentsIntervalId) {
  console.log(pageNum);
  console.log(loadCount);
  console.log("If loadmore is "+checkByEle(loadMoreEle));

  if (loadMoreEle) {
      if (loadCount < timeForLoad && loadCount < 8) {
      
            asynMark = getCurrentAsynMark(0);
            scrollToElement(loadMoreEle);
            clickNode(loadMoreEle);
      
            loadCount ++;
      
          } else {
            var commentsDoc = $("iframe[src*='www.facebook.com/plugins/comments']")[0];
            var requestObj =  createRequestObject(pageNum, null, false, getSerializedDocWithIframe(commentsDoc));
            sendRequest(requestObj);
      
            timeForLoad += 2;
            loadCount = 0;
          }
  
    } else {
      pageNum ++;
      var commentsDoc = $("iframe[src*='www.facebook.com/plugins/comments']")[0];
      clearInterval(operationOnLoadMoreCommentsIntervalId);
      var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentsDoc));
      sendRequest(requestObj);
    }
}

