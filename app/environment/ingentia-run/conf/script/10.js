var timeout;var counter = 0;var timer_is_on = false;var is_send = false;function shouldProcessState() {var state = $('a[id=commentsReadMoreToggle]').attr('href') != null;return state;}function fireStateEvent() {var element = $('a[class=toggleControlBlock][id=commentsReadMoreToggle]');if (element) element.each(function(index, showMoreNode) {showMoreNode.dispatchEvent(mouseEvent);});}function doOperationOnState() {if (shouldProcessState()) {fireStateEvent();setTimeout('doOperationOnState()', 15000);} else {is_send = true;}if (is_send) {var links = $('a[href]').attr('href');var requestObject = {links : links,response : getSerializedDom(),pages : counter,isLast : true};chrome.extension.sendRequest(requestObject);}}function getSerializedDom() {var serializer = new XMLSerializer(); var xml = serializer.serializeToString(document); return xml;}function fireStateEvents() {if (!timer_is_on) {timer_is_on = true;timeout = setTimeout('doOperationOnState()', 3000);}}function scrollToComment() {var element = document.getElementById('toggleFormButton');if (element != null) {var actualTop = element.offsetTop;var current = element.offsetParent;while (current !== null) {actualTop += current.offsetTop;current = current.offsetParent;}scroll(0, actualTop);}fireStateEvents();}$(document).ready(function() {mouseEvent = document.createEvent('MouseEvent');mouseEvent.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, 0, null); setTimeout('scrollToComment()', 5000);});