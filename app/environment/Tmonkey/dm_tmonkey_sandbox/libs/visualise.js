function loadXMLDoc(xmlPath) {
    var xmlDoc;

    if (window.ActiveXObject) {
        // code for IE
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    } else if (document.implementation && document.implementation.createDocument) {
        // code for Mozilla, Firefox, Opera, etc.
        xmlDoc = document.implementation.createDocument("","",null);
    } else {
        alert('Your browser cannot handle this script');
    }

    xmlDoc.async=false;
    xmlDoc.load(xmlPath);

    return xmlDoc;
}

function loadStyle(xmlPath, xslPath) {
    var xml = loadXMLDoc(xmlPath);
    var xsl = loadXMLDoc(xslPath);

    if (window.ActiveXObject) {
        // code for IE
        var res = xml.transformNode(xsl);

        document.getElementById("visualise").innerHTML = res;
    } else if (document.implementation && document.implementation.createDocument) {
        // code for Mozilla, Firefox, Opera, etc.
        var xsltPro = new XSLTProcessor();

        xsltPro.importStylesheet(xsl);
        res = xsltPro.transformToFragment(xml, document);
        document.getElementById("visualise").appendChild(res);
    }
}