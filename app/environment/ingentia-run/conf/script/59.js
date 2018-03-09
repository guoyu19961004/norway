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

  var mark = $("#story");

  if(mark.length) {

    send();

  }

  var commentContainer = $("<div id='comments_' style='display:none;'></div>");

  $("#topic").prepend(commentContainer);



  var commentEleCheckIntervalId = setInterval(function() {



    var commentEle = $(".posts-wrapper")[0];



    if (checkByEle(commentEle)) {

      scrollToElement(commentEle);

      clearInterval(commentEleCheckIntervalId);



      var operationOnLoadMoreCommentsId = setInterval(function() {

        if(checkByAsynMarkValue(asynMark, getCurrentAsynMark())) {

          asynMark = getCurrentAsynMark();

          move(commentContainer);

        } else {

          clearInterval(operationOnLoadMoreCommentsId);

          $("div[id*='post-cloak-']").parent().remove();

          commentContainer.show();

          send();

        }

      }, 6000);



    }

  }, 1000);

}





function getCurrentAsynMark() {

  return $("div[id*='post-cloak-']").length;

}



function move(commentContainer) {

  var comments = $("div[id*='post-cloak-']:not(#post-cloak-1):has(.ember-view.topic-post) article.boxed");

  if(comments.length > 0) {

    var loadMoreEle = comments.find(".contents.regular button.show-replies");

    loadMoreEle.click();

    var cid = setInterval(function () {

      var allReplaiesLoaded = comments.find(".contents.regular button.show-replies").length == 0;

      if (allReplaiesLoaded) {

        clearInterval(cid);

        comments.each(function (i, comment) {

          comment = $(comment);

          var id = comment.attr("id");

          var exists = commentContainer.find("#" + id).length > 0;

          if (!exists) {

            commentContainer.append(comment.clone());

          }

        });

        scrollToBottom();

      }

    }, 1000);

  }

}



function send() {

  var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());

  sendRequest(requestObj);

}
