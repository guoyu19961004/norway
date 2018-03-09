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
    var commentEle = $('div.js-showOtherResponses button.[data-action="show-other-responses"]')[0];
    if (commentEle) {
      clearInterval(commentEleCheckIntervalId);
      scrollToElement(commentEle);
      commentEle.click();
      setTimeout(function() {
        var clickReadMoreToExpandComment = setInterval(function() {
          var NeedExpand = $('article button[data-action="expand-inline"]').not(".is-touched")[0];
          console.log(NeedExpand);

          if(checkByEle(NeedExpand)){
            NeedExpand.click();
            $(NeedExpand).addClass('is-touched');
            console.log("There are "+ $('article button[data-action="expand-inline"]').not(".is-touched").length +" comments need expand.");
          }else {
            console.log("no need expand");
            clearInterval(clickReadMoreToExpandComment);
            console.log("Number of commments is "+getCurrentAsynMark());
            var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
            sendRequest(requestObj);
          };

        },1000);
      }, 5000);
    }else {
      var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
      sendRequest(requestObj);
    };
  }, 1000);
};


function getCurrentAsynMark() {
  return $('.responsesStream.js-responsesStreamOther div.js-streamItem').length;
};

