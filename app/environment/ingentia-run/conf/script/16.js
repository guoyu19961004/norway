var timeOut; var doc = null; function getCommnetIframe() {  var iframes = doc.getElementsByTagName('iframe');  var index = 0;  var commentsIframe = null;  while (true) {   if (index == iframes.length) {    break;   }   var iframeNode = iframes[index];   if (iframeNode.src.indexOf('disqus.com/embed/comments') != -1) {    commentsIframe = iframeNode;    break;   }   index++;  }  return $(commentsIframe); } function shouldProcessState() {  var showMores = getCommnetIframe().contents().find('div[class=load-more]');  var hasMore = false;  showMores.each(function(index, showmore) {   if ('none' != showmore.style.display) {    hasMore = true;   }  });  return hasMore; } function fireStateEvent() {  var mouseEvent = doc.createEvent('MouseEvent');  mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,    false, false, false, 0, null);  var showMores = getCommnetIframe().contents().find(    'a[data-action=more-posts]');  showMores.each(function(index, showmore) {   showmore.dispatchEvent(mouseEvent);  }); } function doOperationOnState() {  if (shouldProcessState()) {   fireStateEvent();   setTimeout('doOperationOnState()', 10000);  } else {   var links = doc.getElementsByTagName('link')[0].href;   var requestObject = {    links : links,    response : getSerializedDom(),    pages : 0,    isLast : true   };   chrome.extension.sendRequest(requestObject);  } } function getSerializedDom() {  var serializer = new XMLSerializer();  var iframeDoc = getCommnetIframe()[0].contentDocument;  var comments = serializer.serializeToString(iframeDoc);  var docStr = $(doc).remove('iframe')[0];  var xml = serializer.serializeToString(docStr);  return xml + comments; } function scrollToComment() {  var element = document.getElementById('disqus_thread');  if (element != null) {   var actualTop = element.offsetTop;   var current = element.offsetParent;   while (current !== null) {    actualTop += current.offsetTop;    current = current.offsetParent;   }   scroll(0, actualTop);   setTimeout('doOperationOnState()', 15000);  } }  function init(){  if(document.documentElement.textContent.search('Follow Us')){   doc = document;   scrollToComment();  }  setTimeout('init()', 1000); }  init();