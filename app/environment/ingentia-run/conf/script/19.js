var pageContent = null;
var pageNumber = 0;
var tabActive = true;

/**
 * has next comments page?
 * @returns {Boolean}
 */
function shouldProcessState() {
    var nextPage = $(".BVRRNextPage a[name*=Review_Display_NextPage]")[0];
    if(nextPage === undefined){
        return false;
    }else{
        return true;
    }
}
/**
 * click nextPageLink, display next comments page
 */
function fireStateEvent() {
    var element = $("a[name*=NextPage]")[0];
    element.click();
    setTimeout('scrollToComment()', 3000);
}

/**
 * 
 * @param index
 * @param total
 */
function getReComment(index,total){ 
    var reComments = $("div[class*=BVDI_COBody] > div[class*=BVDI_COBodyComments]");
    if(reComments.length > 0){
        pageContent+=getSerializedDom(reComments[0]);
    }
    if((total-1) == index){
    	pageNumber += 1;
        var links = $("link[rel=canonical]")[0].href;
        var requestObject = {
            links : links,
            response : pageContent,
            pages : pageNumber,
            isLast : false
        };
        if (shouldProcessState()) {
            chrome.extension.sendRequest(requestObject);
            setTimeout('fireStateEvent()', 2000);
        } else {
            requestObject.isLast = true;
            chrome.extension.sendRequest(requestObject);
        }
    }
}

function doOperationOnState() {
	var mouseEvent = document.createEvent('MouseEvent');
	mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, 0, null);
    pageContent = getSerializedDom(document);
    var showComments = $("span[class=BVDILinkSpan] > span[class*=BVDINonZeroCount]");
    var total = showComments.length;
	if (total == 0) {
		setTimeout(function() {
			getReComment(0, 1);
		}, 3000);
	} else {
        showComments.each(function(index, showmore) {
            setTimeout(function(){
                if(index == 0){
                    showComments[index].dispatchEvent(mouseEvent);;
                }else{
                    $("span[class=BVDILinkSpan] > span[class*=BVDINonZeroCount]")[index+1].dispatchEvent(mouseEvent);;
                }
                setTimeout(function(){getReComment(index,total);}, 4000);
            },index*6000);
        }); 
    }
}

function getSerializedDom(doc) {
    var serializer = new XMLSerializer();
    var xml = serializer.serializeToString(doc);
    return xml;
}

function scrollToComment() {
    var tab4 = $("div[id=reviewsLabelDiv] > a[href*=tab4]")[0];
    if(tab4 != null && tab4 != undefined && tabActive){
    	if(tab4.className.indexOf('current') == -1) {
    		tab4.click();
    		tabActive = false;
    	}
    }
    
    var element = document.getElementById('BVRRCustomLegalDisclaimerID');
    if (element != null) {
        var actualTop = element.offsetTop;
        var current = element.offsetParent;
        while (current !== null) {
            actualTop += current.offsetTop;
            current = current.offsetParent;
        }
        scroll(0, actualTop);
    }
    setTimeout('doOperationOnState()', 5000);
}

/**
 * show all devices text
 * @returns {Boolean}
 */
function processState() {
    var elementLength = $("span[id=showAllDevicesText] > a").length;
    if(elementLength > 0){
        return true;
    }
    return false;
}
function fireEvent() {
    var showAll = $("span[id=showAllDevicesText] > a")[0];
    showAll.click();
    
    setTimeout('scrollToFooter()', 5000);
}
function operationOnState() {
    if (processState()) {
        fireEvent();
    } else {
        var links = $("link[rel=canonical]")[0].href;
        var requestObject = {
            links : links,
            response : getSerializedDoc(),
            pages : 0,
            isLast : true
        };
        chrome.extension.sendRequest(requestObject);
    }
}
function getSerializedDoc() {
    var serializer = new XMLSerializer();
    var xml = serializer.serializeToString(document);
    return xml;
}

function scrollToFooter() {
    var element = document.getElementById('deviceList-legalFooter');
    if (element != null) {
        var actualTop = element.offsetTop;
        var current = element.offsetParent;
        while (current !== null) {
            actualTop += current.offsetTop;
            current = current.offsetParent;
        }
        scroll(0, actualTop);
        
    }
    setTimeout('operationOnState()', 5000);
}

$(document).ready(function() {
    var mark = $("#deviceLayout")[0];
    console.log(mark);
    if (mark) {
        setTimeout('scrollToFooter()', 3000);
    } else {
        setTimeout('scrollToComment()', 3000);
    }
});
