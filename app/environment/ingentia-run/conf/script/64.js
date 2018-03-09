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

	var commentEleCheckIntervalId = setInterval(function() {

		var requestObj =  createRequestObject(1, null, true, getSerializedDoc());
		sendRequest(requestObj);

	}, 1000);
}
