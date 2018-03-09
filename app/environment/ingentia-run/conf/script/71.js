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
  var count = 0;
  var commentEleCheckIntervalId = setInterval(function() {
    var loadAllNode = $("#d2loadall")[0];

    if(loadAllNode.text.indexOf("New") > 0 || count > 5){
      console.log("ready to click hidden or oneline");
      if(clickHiddenNodes() && clickOneLineNodes()){
        console.log("ready to sendRequest");
        var commentNum = $(".comment.full.contain").length;
        console.log("The number of comments is "+commentNum);
        setTimeout(function() {
          var requestObj = createRequestObject(pageNum, null, true, getSerializedDoc());
          sendRequest(requestObj);
        },2000)
      }else{
        clickHiddenNodes();
        clickOneLineNodes();
      }
    }else{
      console.log("ready to click loadAllNode");
      console.log("count is "+count);
      count ++;
      setTimeout(function() {
        loadAllNode.click();
      },4000);
    }

  }, 1000);
}

function clickHiddenNodes() {
  var hiddenNodes = $(".show a");
  console.log(hiddenNodes.length+" hiddenNodes to click");
  var i;
  for (i=0;i<hiddenNodes.length;i++){
    hiddenNodes[i].click();
  }
  var remainNodes = $(".show a").length;
  if(remainNodes > 0){
    return false;
  }else{
    return true;
  }
}

function clickOneLineNodes() {
  var oneLineNodes = $(".comment.oneline a.[id*='comment_link']");
  console.log(oneLineNodes.length+" oneLineNodes to click");
  var i;
  for (i=0;i<oneLineNodes.length;i++){
    oneLineNodes[i].click();
  }
  var remainNodes = $(".comment.oneline a.[id*='comment_link']").length;
  if(remainNodes > 0){
    return false;
  }else{
    return true;
  }
}

