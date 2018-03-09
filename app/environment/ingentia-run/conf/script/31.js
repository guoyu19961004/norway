function getMetrics() {
	debugger;

	var pageName = getPageName();
	var links = $('ul[class=links]').contents();

	var boards = null;
	var pins = null;
	var likes = null;
	var followers = null;
	var following = null;

	if (links.length === 0) {
		links = $('div.UserInfoBar.InfoBarBase.Module.centeredWithinWrapper');

		boards = links.find("a[href*='/boards/'] span.value").text();
		pins = links.find("a[href*='/pins/'] span.value").text();
		likes = links.find("a[href*='/likes/'] span.value").text();
		followers = links.find("a[href*='/followers/'] span.value").text();
		following = links.find("a[href*='/following/'] span.value").text();
	} else {
		var follow = $('ul[class=follow]').contents();
		boards = links.find('a[href=/' + pageName + '/] strong').text();
		pins = links.find('a[href=/' + pageName + '/pins/] strong').text();
		likes = links.find('a[href=/' + pageName + '/pins/?filter=likes] strong').text();
		followers = follow.find('a[href=/' + pageName + '/followers/] strong').text();
		following = follow.find('a[href=/' + pageName + '/following/] strong').text();
	}
	
	var numBoards = removeNonNumericCharacters(boards);
	var numPins = removeNonNumericCharacters(pins);
	var numLikes = removeNonNumericCharacters(likes);
	var numFollowers = removeNonNumericCharacters(followers);
	var numFollowing = removeNonNumericCharacters(following);

	var channelUniqueId = getChannelUniqueId();

	var responseObject = {
		'boards' : +numBoards,
		'pins' : +numPins,
		'likes' : +numLikes,
		'followers' : +numFollowers,
		'following' : +numFollowing,
		'channelUniqueId' : channelUniqueId
	};
	var responseString = JSON.stringify(responseObject);

	sendToExtension(responseString);
}

function getPageName() {
	var url = document.URL;
	var removedFront = url.split("pinterest.com/")[1];
	var removedBack = removedFront.split("/")[0];
	var removedParams = removedBack.split("?")[0];
}

function removeNonNumericCharacters(str) {

	var numericString = str.replace(/[^0-9]/g, '');
	return numericString;
}

function getChannelUniqueId() {
	var tabUrl = $("meta[name='al:android:url']").attr('content');
	var channelUniqueId = tabUrl.replace("pinterest://user/", "");
	
	var regex1 = new RegExp('\\/$');
	channelUniqueId = channelUniqueId.replace(regex1, '');
	var regex2 = new RegExp('^\\/');
	channelUniqueId = channelUniqueId.replace(regex2, '');

	return channelUniqueId;
}

function sendToExtension(responseString) {
	var links = document.URL;
	var requestObject = {
		links : links,
		response : responseString,
		pages : 0,
		isLast : true
	};
	chrome.extension.sendRequest(requestObject);
}

function validate() {
	var index = $(".errorMessage").text().indexOf("Whoops! We couldn't find that page");
	if (index == -1) {

		setTimeout("getMetrics();", 20000);
	} else {
		var requestObject = {
			links : "empty",
			response : "null",
			pages : 0,
			isLast : true
		};
		chrome.extension.sendRequest(requestObject);
	}
}

$(document).ready(function() {
	setTimeout('validate()', 3000);
});