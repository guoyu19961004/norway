var pageNum = 0;
var documentUrl = null;


$(document).ready(function () {
	console.log("ready");
	setTimeout(function () {onPageReady();}, 3000);
});


function onPageReady() {
	console.log("onPageReady");
	if(document.documentURI == "http://it.sohu.com/"){
		console.log("Here is a link node,will not to click;");
		var loadMorePosts = setInterval(function () {
			scrollToBottom();
			var numOfPosts = $("[data-role='news-item']").length;
			console.log("numOfPosts is "+numOfPosts);
			if (numOfPosts < 200) {
				if (numOfPosts % 100 ==0) {
					var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
					sendRequest(requestObj);
					pageNum ++;
				}
			} else {
				var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
				sendRequest(requestObj);
			}
		},1000);

	}else{
		console.log("Try to click page node;");
		var commentEleCheckIntervalId = setInterval(function () {
			var loadMore = theNodeToClick();
			var commentsNum = $('div[node-type="cmt-list"] div[node-type="cmt-item"]').length;
			console.log("Number of comments is "+ commentsNum);
			if(loadMore){
				var requestObj =  createRequestObject(pageNum, null, false, getSerializedDoc());
				sendRequest(requestObj);
				setTimeout(function () {
					scrollToElement(loadMore);
					loadMore.click();
					pageNum ++;
				},2000);
			}else{
				setTimeout(function () {
					var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
					sendRequest(requestObj);
				},1000);
			}

		},3000);

	}
}


function theNodeToClick(){
	var lastPageNodes = $(".cmt-more-wrap-gw:visible");
	if(checkByEle(lastPageNodes[0])){
		return lastPageNodes[0]
	}else{
		return null
	}
}


function scrollToBottom() {
	window.scrollTo(0, document.documentElement.scrollHeight-document.documentElement.clientHeight);
}
