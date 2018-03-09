var _mark = null;
var _pageNum = 0;
var _retryTimes = 0;
var _maxRetryTimes = 5;
var _operationController = 0;
var spotIframe = null;
var commentContainer = document.createElement('div');
commentContainer.setAttribute("id", "comments_");
commentContainer.setAttribute("style", "display:none;");

function isPageLoaded() {
   var count = 0;
   var checkIfPageLoaded = setInterval(function () {
       count++;
       spotIframe = document.querySelector("div[class='spot-im-comments-wrapper']").querySelectorAll("iframe")[0];
       if (spotIframe != null) {
           clearInterval(checkIfPageLoaded);
           console.log("Page have loaded.");
           document.querySelector("div[class='spot-im-comments-wrapper']").appendChild(commentContainer);
           scrollToElement(spotIframe);
           onPageReady();
       }
   }, 500)
}


function ifExistComments() {
   var commentNodes = spotIframe.contentDocument.querySelectorAll(".sp_message-view");
   return commentNodes.length;
}


function getTheNodeToClick() {
   var loadMoreReplies = spotIframe.contentDocument.querySelectorAll(".sp_load-more-messages");
   var showMoreRplies = spotIframe.contentDocument.querySelectorAll(".sp_show-more-replies");
   var seeMore = spotIframe.contentDocument.querySelectorAll(".sp_see-more");
   if (loadMoreReplies.length > 0) {
       return loadMoreReplies;
   } else if (showMoreRplies.length > 0) {
       return showMoreRplies;
   } else if (seeMore.length > 0) {
       return seeMore;
   } else {
       return null;
   }
}


function loadOpeerator(item) {
   for (var i = 0; i < item.length; i++) {
       item[i].click();
   }
}


function hasPageUpdated() {
   if (_mark != signForPageUpdated()) {
       _mark = signForPageUpdated();
       return true;
   }

   return false;
}


function signForPageUpdated() {
   return spotIframe.contentDocument.querySelectorAll(".sp_message-view").length;
}


function scrollToElement(element) {
   if (element != null) {
       var actualTop = element.offsetTop;
       var current = element.offsetParent;
       while (current !== null) {
           actualTop += current.offsetTop;
           current = current.offsetParent;
       }
       scroll(0, actualTop);
   }
}


function onPageReady() {
   var operationInterval = setInterval(function () {
       _retryTimes++;
       console.log("---------------------------------------");
       console.log("_operationController is " + _operationController);
       console.log("_retryTimes is " + _retryTimes);
       console.log("_mark is " + _mark);

       if (_retryTimes >= _maxRetryTimes) {

           console.log("_retryTimes is more than _maxRetryTimes");
           clearInterval(operationInterval);
           console.log("over");
           if(commentContainer.childNodes.length > 0){
             commentContainer.removeChild(commentContainer.childNodes[0]);
           }
           var commentsListNode = spotIframe.contentDocument.querySelector(".sp_messages-list").cloneNode(true);
           commentContainer.appendChild(commentsListNode);
           var requestObj =  createRequestObject(_pageNum, null, true, getSerializedDoc());
           sendRequest(requestObj);

       } else {
           if (_operationController == 0) {
               if (ifExistComments() == null) {
                   _maxRetryTimes = 10;
               }
               if (ifExistComments() > 0) {
                   _maxRetryTimes = 5;
                   _operationController = 1;
               }
               if (ifExistComments() == 0) {
                   _retryTimes = _maxRetryTimes;
               }
           };

           if (_operationController == 1) {
               if (getTheNodeToClick() != null) {
                   _operationController = 2;
                   _retryTimes = 0;
               }
           };

           if (_operationController == 2) {
               loadOpeerator(getTheNodeToClick());
               _operationController = 3;
           };

           if (_operationController == 3) {
               if (hasPageUpdated()) {
                   console.log("Page have updated.");
                   console.log("_pageNum is " + _pageNum);
                   if(commentContainer.childNodes.length > 0){
                     commentContainer.removeChild(commentContainer.childNodes[0]);
                   }
                   var commentsListNode = spotIframe.contentDocument.querySelector(".sp_messages-list").cloneNode(true);
                   commentContainer.appendChild(commentsListNode);
                   var requestObj =  createRequestObject(_pageNum, null, false, getSerializedDoc());
                   sendRequest(requestObj);
                   _pageNum++;
                   _operationController = 1;
                   _retryTimes = 0;
               }
           };

       };
   }, 4000)
}

isPageLoaded();
