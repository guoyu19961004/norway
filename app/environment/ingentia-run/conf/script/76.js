var pageNum = 0;

$(document).ready(function () {
	console.log("ready");
	setTimeout(function () {onPageReady();}, 3000);
});


function onPageReady() {
	console.log("onPageReady");
	var commentEleCheckIntervalId = setInterval(function () {
		var commentEle = $("a.topic-comments")[0];
		if(commentEle){
			clearInterval(commentEleCheckIntervalId);
			commentEle.click();
			var commentComentNum = $(".topic-comments__count").text().length;
			if(commentComentNum > 0){
				var waitCommentsLoadIntervalId = setInterval(function () {
					var commentContainer = $("iframe[src*='comments.rambler.ru/widget']")[0];
					var commentNumLoaded = $(commentContainer).contents().find(".rc-Comment__text").length;
					console.log("Here are "+ commentNumLoaded + " comments.");
					if(commentNumLoaded > 0){
						var requestObj =  createRequestObject(pageNum, null, true, getSerializedDocWithIframe(commentContainer));
						sendRequest(requestObj);
					}
				},500);
			}else{
				var requestObj =  createRequestObject(pageNum, null, true, getSerializedDoc());
				sendRequest(requestObj);
			}
		}
	},1000);
}