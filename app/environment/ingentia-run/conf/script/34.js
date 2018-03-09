/*-----------digi.tech.qq.com-----------------*/
var jumpToFoot = true;
var mouseEvent = null;
var pageNumber = 1;

function getSerializedDom() {
    var serializer = new XMLSerializer();
    var xml = serializer.serializeToString(document);
    return xml;
}

function shouldProcessState() {

    var pageNumbers = document.getElementsByClassName("common-pagination")[0];
    if(pageNumbers == null || pageNumbers == undefined || pageNumbers.length == 0){
        return false;
    }else{
        var number = pageNumbers.getElementsByTagName("a")[0].text;
        if(number == "下一页>>"){
            return true;
        }else{
            return false;
        }
    }
}

function fireStateEvent() {
    mouseEvent = document.createEvent('MouseEvent');
    mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, 0,null);
    var pageNumbers = document.getElementsByClassName("common-pagination")[0];
    var number = pageNumbers.getElementsByTagName("a")[0];
    number.dispatchEvent(mouseEvent);
    pageNumber+=1;
    setTimeout('doOperationOnState()', 5000);
}

function doOperationOnState() {
    var links = document.getElementsByTagName("link")[1].href;
    var requestObject = {
        links : links,
        response : getSerializedDom(),
        pages : pageNumber,
        isLast : false
    };
    
    if (shouldProcessState()) {
        chrome.extension.sendRequest(requestObject);
        setTimeout('fireStateEvent()', 2000);
    } else {
        requestObject.isLast=true;
        chrome.extension.sendRequest(requestObject);
    }
}

function foundCommentUrl(){
    var moreBtn = document.getElementsByClassName("moreBtn")[0];
    if(moreBtn == null || moreBtn == undefined || moreBtn.length == 0){
        setTimeout('doOperationOnState()', 2000);
    }else{
        var links = moreBtn.getElementsByTagName("a")[0].href;
        var doc = getSerializedDom();
        doc += ("<a id='commentUrl' href='"+links+"'>comments</a>");
        var requestObject = {
            links : links,
            response : doc,
            pages : 1,
            isLast : true
        };
        chrome.extension.sendRequest(requestObject);
    }
}

function scrollToComment() {
    if (jumpToFoot) {
        var element = document.getElementById('tcopyright');
        if (element != null) {
            jumpToFoot = false;
            var actualTop = element.offsetTop;
            var current = element.offsetParent;
            while (current !== null) {
                actualTop += current.offsetTop;
                current = current.offsetParent;
            }
            scroll(0, actualTop);
        }
        setTimeout('foundCommentUrl()', 2000);
    }
}

$(document).ready(function() {
    setTimeout('scrollToComment()', 3000);
});