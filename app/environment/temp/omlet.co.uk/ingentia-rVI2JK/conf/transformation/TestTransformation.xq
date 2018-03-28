(:TEMPLATE-BLOG-v2.2.2:)
xquery version "1.0";
declare namespace h = "http://www.w3.org/1999/xhtml";
declare namespace ig = "http://www.integrasco.no/";
declare namespace xqf = "http://www.xqueryfunctions.com" ;
declare namespace t = "http://www.integrasco.no/transform" ;
declare namespace zf = "http://www.integrasco.no/blogtemplate";
declare namespace d = "http://www.dian.org.cn/";
declare namespace functx = "http://www.functx.com"; 

(: Static variables - should NOT be changed :)
declare variable $documentUri as xs:string external;
declare variable $gmtOffset as xs:string external;
declare variable $rootNode := //h:html;

(: Global variables :)
declare variable $validateUri := "nevillehobson.com";
declare variable $anonymousAuthorName := "guest";
declare variable $isPostAuthorDefaulted := false();
declare variable $useTimeLimitationOnBlogPost := false();
declare variable $useTimeLimitationOnComment := false();

(:
=== BLOG TRANSFORMATION GUIDELINE ===

Update the functions inside the 'code to update' tags. Only the function body's are supposed to
be changed. 


1.    Set the correct global variables
   
     - $validateUri                    : This is the base url that will be used to generate the
                                         validations uris. 
                                         Typical if the name of the site is "http://www.emultrix.com/forums/index.php"
                                         then $validateUri should be set to "emultrix.com"
                        
    
      -$anonymousAuthorName           : This variable is used when you are not able to find an author name
                                        for an entry. It is also used in  zf:notAllAuthorsAreGuests to check if all
                                        authors are guests. If guest users are described with another guest synonym, please use this instead.                        
      
      
      -$isPostAuthorDefaulted         : When you find that blogpost has no author and be sure that other posts' authors are not exist too,
                                        you can set the variable at true().Then template will generate author according to $validateUri.      
     
     
      -$useTimeLimitationOnBlogPost   : control if the time limitation should be used to avoid duplicated BlogPosts due to blogPost id changed.
      
      
      -$useTimeLimitationOnComment    : control if the time limitation should be used to avoid duplicated comments due to comment id changed.
      
        
2.    Update the functions to correctly reflect the structure of the website.  

3.     NAMESPACES
       Here are the internal namespaces being used with a short explanation:
       ig = "http://www.integrasco.no/";            --: Functions that are of high enough quality and may be used outside a specific transformation 
                                                        gets this namespace.
       t = "http://www.integrasco.no/transform" ;   --: Functions that are written to do a certain task in a very specific way, and does not
                                                        meet the requirements to bellong to the integrasco datamanagement library, gets this namespace.
       zf = "http://integrasco.no/";                --: Functions with this namespace bellongs to the boilerplate code, and should
                                                        not be changed, unless it is absolutely necessary. 
       d = "http://www.dian.org.cn/"                --: Functions with this namespace are created by Dian Group.
                                                        
:)

(:LIBRARY - START:)
declare function ig:extractEx( $input as xs:string, $regex as xs:string )
    as xs:string
{
    let $regex  := if( contains( substring( $regex, 1, 1 ), "^" ) ) then
                       error(xs:QName('ig:extractEx'), "Don't support linestart (^) qualifier", $regex )
                   else
                       $regex                   
    let $ret := if( matches($regex, "\(.+\)" ) )
                then replace($input, $regex,  "#!ST4RT!#$1#!ST4RTND!#" )
                else replace($input, concat("(", $regex, ")" ), "#!ST4RT!#$1#!ST4RTND!#" )                        
    let $ret := substring-before( substring-after( $ret, "#!ST4RT!#" ), "#!ST4RTND!#" )
    return $ret    
};

(:uri is the target to solve, make sure the baseUri is the Base Uri to resolve uri with and the subUri to concat it to uri. :)
declare function ig:resolveUri($uri as xs:string, $baseUri as xs:string) as xs:string
{
    if(not($uri) or matches(lower-case($uri), '^(deleted?|none)\.?$')) then ''
    else if(matches($uri, '^https?://[\w+\.]+/.+')) then $uri
    else 
        let $uri := tokenize($uri, '//')[last()]
        return
            if(matches($uri, t:getSpecialCharacterRegex())) 
            then concat($baseUri, $uri)
            else resolve-uri($uri, $baseUri)
};

(:uri is the target to solve, baseUri is set as documentUri. :)
declare function ig:resolveUri($uri as xs:string) as xs:string
{
    ig:resolveUri($uri, $documentUri)
};

declare function ig:removeParamValueFromQuery($query as xs:string*, $param as xs:string) as xs:string*
{
    let $remove := if( matches($query,concat("\?",$param,"=")) ) then
                       ig:subBefore(substring-after($query, concat("?",    $param,"=")),"&amp;")
                   else if( matches($query,concat("&amp;",$param,"=")) ) then
                       ig:subBefore(substring-after($query, concat("&amp;",$param,"=")),"&amp;")
                   else ""
    return if(string-length($remove) > 0)then
        let $r      := replace($query,concat($param,"=",$remove),"")
        let $r      := replace(replace(replace($r,"\?&amp;","?"),"(&amp;)+","&amp;"),"((\?)|(&amp;))\s*$","")
        return $r
    else $query
};

declare function ig:getParamValueFromQuery( $query as xs:string, $param as xs:string, $default as xs:string ) as xs:string
{
    let $q := replace( $query, "#.*$", "" )
    let $r := if( matches( $q, concat("\W", $param, "=", ".+$" ) ) )
              then let $r := if( matches( $q, concat( "\?", $param, "=" )))
                                then    ig:subBefore( substring-after( $q, concat( "?", $param, "=") ), "&amp;" )
                                else    ig:subBefore( substring-after( $q, concat( "&amp;", $param, "=") ), "&amp;" )
                                return $r
              else $default
    return $r
};

declare function ig:setParamValueFromQuery( $query as xs:string, $param as xs:string, $value as xs:string ) as xs:string
{    
    if( matches( $query, concat("\W?", $param, "=", ".+$" ) ) )    
    then replace( $query, concat($param, "=[^&amp;#]+"), concat($param, "=", $value) )
    else
        if( contains($query, "#") )
        then if( contains($query,"?") )
                 then replace($query, "#", concat("&amp;", $param, "=", $value, "#"))
                 else replace($query, "#", concat("?", $param, "=", $value, "#"))  
        else if( contains($query,"?") )
                 then concat($query, "&amp;", $param, "=", $value )
                 else concat($query, "?", $param, "=", $value )             
};

declare function  xqf:escape-for-regex 
  ( $arg as xs:string? )  as xs:string {

       
   fn:replace($arg,
           '(\.|\[|\]|\\|\||\-|\^|\$|\?|\*|\+|\{|\}|\(|\))','\\$1')
 
} ;
 
declare function xqf:substring-before-last 
  ( $arg as xs:string? ,
    $delim as xs:string )  as xs:string {

   if (fn:matches($arg, xqf:escape-for-regex($delim)))
   then fn:replace($arg,
            fn:concat('^(.*)', xqf:escape-for-regex($delim),'.*'),
            '$1')
   else ''
 
} ;

declare function xqf:substring-after-last 
  ( $arg as xs:string? ,
    $delim as xs:string )  as xs:string {
       
   replace ($arg,concat('^.*',xqf:escape-for-regex($delim)),'')
 } ;
 
declare function xqf:index-of-node 
  ( $nodes as node()* ,
    $nodeToFind as node() )  as xs:integer* {
       
  for $seq in (1 to count($nodes))
  return $seq[$nodes[$seq] is $nodeToFind]
 } ;
 
declare function ig:extract( $input as xs:string, $regex as xs:string )
    as xs:string
{
    let $regex  := if( contains( substring( $regex, 1, 1 ), "^" ) ) then
                       error(xs:QName('ig:extract'), "Don't support linestart (^) qualifier", $regex )
                   else
                       $regex
    let $input  := substring-after( $input, tokenize( $input, $regex )[1] )
    let $postlen := string-length( replace( $input, concat( "^", $regex ), "" ) )    
    let $r := substring( $input, 1, string-length( $input ) - $postlen  )
    
    return if( matches( $input, $regex ) ) then
                $r
           else
               ""
};

declare function ig:normalize-timestamp( $timestamp as xs:string )
    as xs:string
{
    let $timestamp := lower-case( normalize-space( $timestamp ) )
    let $time_flag := if( matches($timestamp, "\s*[A|a][M|m]\s*$") ) then "am"
                      else if( matches($timestamp, "\s*[P|p][M|m]\s*$") ) then "pm"
                          else ""
    let $timestamp := normalize-space( replace( $timestamp, "[^0-9]", " " ) )                      
    let $tl := tokenize( $timestamp, " " )
    let $ts := for $n in $tl return if( matches( $n, "\d{2,}" ) ) then $n else concat( '0', $n )    
    return( normalize-space( concat( string-join( $ts, " " ), " ", $time_flag ) ) )
}; 

declare function ig:subBefore($string as xs:string, $checkFor) as xs:string
{
    let $string := if(contains($string, $checkFor)) then substring-before($string, $checkFor) else $string    
    return $string
};

declare function ig:subAfter($string as xs:string, $checkFor) as xs:string
{
    let $string := if(contains($string, $checkFor)) then substring-after($string, $checkFor) else $string    
    return $string
};

declare function ig:pow( $base as xs:integer, $pow as xs:integer )
    as xs:integer
{
    if( $pow > 0 ) then
        $base * ig:pow( $base, $pow - 1 )
    else
        1
};

declare function ig:hexToDecimal( $hex as xs:string )
    as xs:string
{
    let $len := string-length($hex) + 1
    let $hex := replace( lower-case($hex), "[^0-9a-f]", "" )
    let $translate := for $i in (1 to (string-length($hex))) return
            let $letter := substring($hex,$len - $i,1)
            return replace( replace( replace( replace( replace( replace(
                       $letter, "a", "10" ), "b", "11" ), "c", "12" ), "d", "13" ),
                       "e", "14" ), "f", "15" )                       
    let $sums := for $n at $i in $translate 
                     return( xs:integer($n) * ig:pow( 16, $i - 1 ) )                 
    return string( sum($sums) )
};

declare function ig:decodeFromUri( $in as xs:string, $output as xs:string )
    as xs:string
{
    if( string-length($in) < 1 ) then $output
    else
        let $translate := substring($in[1], 1, 1 )        
        return
        if( $translate = '%' ) then
            ig:decodeFromUri( substring($in,4),
                concat( $output, codepoints-to-string(xs:integer(ig:hexToDecimal( substring( $in, 2, 2 ))))) )
        else
            ig:decodeFromUri( substring($in,2), concat( $output, $translate ) )
};

declare function ig:nsj( $text as xs:string* ) as xs:string
{
    let $string := ig:normalize-space( string-join( $text, "") )
    return $string
};

declare function ig:removeBadUnicode($inputStr as xs:string) as xs:string {
    let $codePoint := fn:string-to-codepoints($inputStr)
    let $str := for $point in $codePoint where (($point > 31) and ($point < 127))
                    return $point
    
    let $ret := fn:codepoints-to-string($str)
    return( $ret )
};

declare function ig:removeTagByNodes
    ( $elements as node()*, $nodes as node()* )
        as node()*
{
        for $e in $elements return
            if (exists($nodes[. is $e])) then
                ()
            else if ($e instance of element()) then
                element {node-name($e)}
                        {$e/@*, ig:removeTagByNodes($e/node(),$nodes)}
            else if($e instance of document-node()) then
                ig:removeTagByNodes($e/node(), $nodes)
            else
                $e
};

declare function ig:removeTagByName
    ( $elements as node()*, $name as xs:string )
        as node()*
{
       for $e in $elements
       return if( $e instance of element() ) 
              then if( string(node-name($e)) = $name ) then
                  ()
                  else 
                      element { node-name($e) }
                              { $e/@*, ig:removeTagByName($e/node(),$name) }
               else if( $e instance of document-node() ) then
                      ig:removeTagByName($e/node(), $name)
               else    $e
};

declare function ig:removeTagByAttribute
    ( $elements as node()*, $attribute as xs:string, $value as xs:string )
        as node()*
{
       for $e in $elements
       return if( $e instance of element() ) 
              then if( max( for $a in $e/@*
                              where( string(name($a)) = $attribute and contains(string($a),$value) )
                              return 1 ) > 0 ) then ()
                  else  element { node-name($e) }
                                { $e/@*, ig:removeTagByAttribute($e/node(),$attribute, $value) }
               else if( $e instance of document-node() ) then
                      ig:removeTagByAttribute($e/node(),$attribute, $value)
               else    $e
};

declare function ig:removeTagByValue
    ( $elements as node()*, $text as xs:string )
        as node()*
{
       for $e in $elements
       return if( $e instance of element() ) 
              then element { node-name($e) }
                           { $e/@*, ig:removeTagByValue($e/node(), $text) }
              else if( $e instance of document-node() ) then
                      ig:removeTagByValue($e/node(), $text)
                   else
                           if( contains( string($e), $text ) ) then ()
                                                       else $e
};

declare function ig:removeTagByValueRegex
    ( $elements as node()*, $re as xs:string )
        as node()*
{
       for $e in $elements
       return if( $e instance of element() ) 
              then element { node-name($e) }
                           { $e/@*, ig:removeTagByValueRegex($e/node(), $re) }
              else if( $e instance of document-node() ) then
                      ig:removeTagByValueRegex($e/node(), $re)
                   else
                           if( matches( string($e), $re ) ) then ()
                                                       else $e
};

declare function ig:findNodeIndexByAttribute( $nodeSet as element()*, $attribute as xs:string
                                                                     ,$value as xs:string )
    as xs:integer*
{
       let $childNodeSet := $nodeSet/node()
       let $iSet := for $e at $i in $childNodeSet
                        return if( $e instance of element() ) then
                                    for $a in $e/@* return
                                        if( string(name($a)) = $attribute and
                                            contains( string($a), $value ) ) then $i else 0
                               else  0
       let $iSet := distinct-values( $iSet )
       let $iSet := for $n in $iSet order by number($n) return $n
       let $iSet := if( empty( $iSet ) ) then $iSet
                    else if( $iSet[1] = 0 ) then remove( $iSet, 1 ) else $iSet
       return( $iSet )                         
};

declare function ig:findNodeIndexByRegex( $nodeSet as element()*, $re as xs:string )
    as xs:integer*
{
       let $childNodeSet := $nodeSet/node()
       let $iSet := for $e at $i in $childNodeSet
                        return if( $e instance of element() ) then
                                    if( matches(normalize-space(string-join($e//text(),"")), $re) )
                                    then $i else 0
                               else if( matches(normalize-space(string-join($e,"")), $re) )
                                   then $i else 0
       let $iSet := distinct-values( $iSet )
       let $iSet := for $n in $iSet order by number($n) return $n
       let $iSet := if( empty( $iSet ) ) then $iSet                       
                    else if( $iSet[1] = 0 ) then remove( $iSet, 1 ) else $iSet
       return( $iSet )                           
};

declare function ig:findNodeIndexByName( $nodeSet as element()*, $name as xs:string )
    as xs:integer*
{
       let $childNodeSet := $nodeSet/node()
       let $iSet := for $e at $i in $childNodeSet
                        return if( $e instance of element() ) then
                                    if( string(node-name($e)) = $name ) then $i else 0
                                    else  0
                               
       let $iSet := distinct-values( $iSet )
       let $iSet := for $n in $iSet order by number($n) return $n
       let $iSet := if( empty( $iSet ) ) then $iSet
                    else if( $iSet[1] = 0 ) then remove( $iSet, 1 ) else $iSet
       return( $iSet )                         
};

declare function ig:prepareForUri( $input as xs:string ) as xs:string {

    let $input := ig:normalize-space($input)
    let $input := lower-case($input)
    let $input := encode-for-uri($input)
    let $input := replace($input, "~", "tilde")
    let $input := replace( $input, "[^-A-Za-z_0-9.%]", "" )
    
    return $input

};

declare function ig:cleanUri( $link as xs:string ) as xs:string {

    let $doEndwithSlash     := matches($link, "/$" )
    let $doAtartwithHttps   := matches($link, "^https" )
    let $link               := replace( $link, "http://", "" )
    let $link               := replace( $link, "/$", "" )
    
    let $tokenizedLink      := tokenize( $link, "/" )
    
    let $link               := string-join(
                                  for $tl in $tokenizedLink return
                                      if( $tl = $tokenizedLink[last()] ) then
                                              if($doEndwithSlash) then
                                                      concat( ig:prepareForUri($tl), "/" )
                                                  else 
                                                      ig:prepareForUri($tl)
                                          else
                                             concat( ig:prepareForUri($tl), "/" )
                              , "" )
        
    
    return if( string-length( ig:normalize-space( $link ) ) > 0 ) then
            if( $doAtartwithHttps ) then
                    concat( "https://", $link )
                else concat( "http://", $link )
        else ""
};

declare function ig:isEmptyNode( $node as node()* ) as xs:boolean 
{    
    if( not( string-length(ig:nsj($node/descendant-or-self::text())) = 0 ) and not(name($node)="script") )then
        fn:false()
    else if( exists($node//h:img[matches(@src,".+")]) or (name($node)="img" and string-length($node/@src)>0)  )then
        fn:false()
    else if( name($node)="br" and string-length($node/@clear)>0  )then
        fn:false()
    else if( exists($node//h:object[matches(@*[1],".+")]) or (name($node)="object" ) )then
        fn:false()
    else if( exists($node//h:embed[matches(@*[1],".+")]) or (name($node)="embed" ) )then
        fn:false()
    else if( exists($node//h:applet[matches(@*[1],".+")]) or (name($node)="applet" ) )then
        fn:false()
    else
        fn:true()
};


declare function ig:normalize-space( $string as xs:string ) as xs:string
{
    let $badChars := concat( "[", codepoints-to-string( 160 ), codepoints-to-string( 8204 ), codepoints-to-string( 8205 ), "]" )
    let $string   := normalize-space( replace( $string, $badChars, " " ) )
    return $string
};

declare function ig:convertToMMddyyyy( $timestamp as xs:string*, $datePattern as xs:string* ) as xs:string* {

    let $dayExp         :=  "(dd|d)"
    let $monthExp       :=  "(MM|M)"
    let $yearExp        :=  "(yyyy|yy)"
    let $hourExp        :=  "(HH|hh|H|h)"
    let $minuteExp      :=  "(mm|m)"
    let $secondExp      :=  "(ss|s)"
    
    let $stampList      :=  tokenize( normalize-space( replace( $timestamp, "\D", " " ) ), "\D" )
    let $dpList         :=  tokenize( $datePattern, "\W")
    let $indexList      :=  for $dp in $dpList
                                return
                                    if( matches( $dp, $monthExp ) ) then
                                        1
                                    else if( matches( $dp, $dayExp ) ) then
                                        2
                                    else if( matches( $dp, $yearExp ) ) then
                                        3
                                    else if( matches( $dp, $hourExp ) ) then
                                        4
                                    else if( matches( $dp, $minuteExp ) ) then
                                        5
                                    else if( matches( $dp, $secondExp ) ) then
                                        6
                                    else
                                        0
    return 
        normalize-space(string-join(
            for $n at $i in $dpList
                return
                    if( string-length( $stampList[index-of($indexList, $i)] ) = 0 ) then
                        "00 "
                    else
                        concat($stampList[index-of($indexList, $i)], " ")               
        , ""))

};

declare function ig:covertFromAmPmTo24HourTime( $time as xs:string*, $amPm as xs:string* ) as xs:string* {
    
    (: strip input timestamp for nonvalid chars and tokenize it to a list :)
    let $tl             :=  tokenize( normalize-space(replace($time, "\D", " ")), " " )
    
    (: extraxt all datetime param. :)
    let $year           :=  $tl[3]
    let $month          :=  $tl[1]
    let $day            :=  $tl[2]
    let $hours          :=  $tl[4]
    let $mins           :=  $tl[5]
    let $sec            :=  $tl[6]
    
    (: check if valid:)
    return if( ( string-length( $amPm ) > 0 ) and ( string-length( $year ) > 0 ) and ( string-length( $month ) > 0 ) and ( string-length( $day ) > 0 ) and ( string-length( $hours ) > 0 ) ) then
        
        let $year           :=  $year cast as xs:integer
        let $month          :=  $month cast as xs:integer
        let $day            :=  $day cast as xs:integer
        let $hours          :=  $hours cast as xs:integer
        
        (: Check if timestamp is pm  pm :)
        let $isPm           :=  if( matches( $amPm, "pm" ) ) then true() else false()
        let $isAm           :=  if( matches( $amPm, "am" ) ) then true() else false()
        
        let $hours          :=  if( $isPm and not($hours = 12 ) ) then
                                    $hours + 12
                                else if( $isAm and ($hours = 12 ) ) then
                                    0
                                else $hours


        (: Increments the date if hour is 12 pm  and creates a new timestamp :)
        let $newStamp       :=  concat(
                                    if(string-length($month cast as xs:string)=1) then concat("0", $month )else $month cast as xs:string, " ", 
                                    if(string-length($day cast as xs:string)=1) then concat("0", $day )else $day cast as xs:string, " ", 
                                    if(string-length($year cast as xs:string)=2) then concat("20", $year )else $year cast as xs:string, " ", 
                                    if(string-length($hours cast as xs:string)=1) then concat("0", $hours )else $hours cast as xs:string, " ", 
                                    if(string-length($mins cast as xs:string)=1) then concat("0", $mins )else $mins cast as xs:string, " ", 
                                    if(string-length($sec cast as xs:string)=1) then concat("0", $sec )else $sec cast as xs:string
                                )
                                    
                                        
        return $newStamp
    else if(( string-length( $year ) > 0 ) and ( string-length( $month ) > 0 ) and ( string-length( $day ) > 0 )) then
        concat(
            if(string-length($month cast as xs:string)=1) then concat("0", $month )else $month cast as xs:string, " ", 
            if(string-length($day cast as xs:string)=1) then concat("0", $day )else $day cast as xs:string, " ", 
            if(string-length($year cast as xs:string)=2) then concat("20", $year )else $year cast as xs:string, " ", 
            if(string-length($hours cast as xs:string)=1) then concat("0", $hours )else $hours cast as xs:string, " ", 
            if(string-length($mins cast as xs:string)=1) then concat("0", $mins )else $mins cast as xs:string, " ", 
            if(string-length($sec cast as xs:string)=1) then concat("0", $sec )else $sec cast as xs:string
        )
    else
        concat("Timestam not valid: ", $time )
};

declare function ig:isEmptyString( $str as xs:string, $re as xs:string* )
    as xs:boolean
{
    let $re := if( exists($re) and not($re = "") ) then $re else "[^\w]"               
    return if( string-length( replace( $str, $re, "" ) ) > 0 )
           then    fn:false()
           else    fn:true()
};

declare function ig:StringHash( $string as xs:string )
    as xs:integer
{
    let $preHash := if( string-length($string) > 0 ) then
                        ig:StringHash( substring($string,2) )
                    else 0        
    let $points := string-to-codepoints( $string )
    let $m      := (31,  73, 313,  3, 83, 53, 101,  2,  41,  5, 137, 613,
                     7, 401, 109, 11, 79, 13,  17, 19, 421, 23,  29, 967)
    let $hash := for $v at $i in $points
                     return( ( $v * $i * 33) +
                             ( 7673 * $points[$m[$i mod count($m)] mod count($points)] ) )
    let $hash := max( (0, xs:integer(sum($hash)) + xs:integer(avg($points)) ) ) 
    return( ( $preHash*3 + $hash ) mod 2147483647 ) 
};

declare function ig:appendToNode( $node as node(), $append as node() ) as node()
{
    element { node-name($node) }
            {$node/node(), $append}         
};

declare function ig:appendToNodeByValue( $node as node(), $name as xs:string, $append as item() ) as node()
{
    element { node-name($node) }
            {$node/node(), element {$name}{$append} }         
};

declare function ig:combineNodes( $name as xs:string, $a as node()*, $b as node()*) as node()
{
    element { $name }
            {$a, $b}         
};

declare function ig:current-dateTime-adjusted() as xs:dateTime {
     if(starts-with($gmtOffset,'-'))
     then   fn:adjust-dateTime-to-timezone(current-dateTime(), 
                xs:dayTimeDuration(concat("-PT",substring-after($gmtOffset,'-'),"H"))) 
     else
            fn:adjust-dateTime-to-timezone(current-dateTime(), 
                xs:dayTimeDuration(concat("PT",$gmtOffset,"H"))) 
};

declare function d:filterEffectiveNode($param1 as node()*, $param2 as node()*) as node()*
{
    if( ig:isEmptyNode( $param2 ) and not( ig:isEmptyNode( $param1 ))) then    
        $param1
    else if( ig:isEmptyNode( $param1 ) and not( ig:isEmptyNode( $param2 ))) then
        $param2
    else if( ig:isEmptyNode( $param2 ) and ig:isEmptyNode( $param1 ) ) then
        ()
    else
        error( xs:QName('d:filterEffectiveNode'), "Both params have valid node!" )
};

declare function d:filterEffectiveString($param1 as xs:string*, $param2 as xs:string*) as xs:string*
{
    if( string-length(ig:nsj( $param2 )) = 0 and string-length(ig:nsj( $param1 )) > 0 ) then    
        $param1
    else if( string-length(ig:nsj( $param1 )) = 0 and string-length(ig:nsj( $param2 )) > 0 ) then
        $param2
    else if( string-length(ig:nsj( $param1 )) = 0 and string-length(ig:nsj( $param2 )) = 0 ) then
        ""
    else
        error( xs:QName('d:filterEffectiveString'), "Both params have valid string!" )
};

(: LEGACY CODE - START :)
declare function ig:generateTime($timestamp as xs:string, $numberAtPage as xs:integer, 
$page as xs:integer, $postsPerPage as xs:integer) as xs:string {
    
    (: calculate the logic time for the current post :)
    let $logicTime := $numberAtPage + (($page - 1) * $postsPerPage)
    
    (: calculate number of hours for the current post :) 
    (:will be zero as long as the thread contains an ammount of posts smaller than 3600:)
    let $hour := ($logicTime div 3600) cast as xs:integer
    
    (: calculates number of minutes :)
    (: will be zero if number of posts in the thread is smaller than 60:)
    let $minute := (($logicTime - ($hour * 3600)) div 60) cast as xs:integer
    
    (: calculates number of seconds :)
    let $second := $logicTime - (($hour * 3600) + ($minute * 60)) cast as xs:integer
    
    (: returns complete timestamp in format: dd MM yyyy HH mm ss :)
    return concat($timestamp, " ", $hour, " ", $minute, " ", $second)
};
(: LEGACY CODE - END :)
(:LIBRARY - END:)

(:BETA BOILERPLATE CODE - START:)
declare function t:translateRelativeTime( $timestamp as xs:string, $timePattern as xs:string, $lang as node() ) as xs:string
{
    let $ts := lower-case( $timestamp )
    let $durations :=
        for $d in $lang/duration return
            for $k in $d/key return
            if( matches( $ts, $k/text()) )
            then
                let $n  := ig:extractEx($ts, $k/text())
                let $n  := if( exists($d/mul) ) then string( xs:integer($n) * xs:integer($d/mul/text()) ) else $n
                let $dr := normalize-space(replace($d/value/text(), "\$1", $n ))
                let $ts := replace($ts,$k/text(),$dr)
                return concat( $dr, "#" )
            else ""
    let $a := tokenize( string-join( $durations, "" ), "#" )
    let $duration := for $node in $a
                     return
                         replace($node,"\s","")
    let $durationYM := for $node in $duration
                       where (matches($node,"P\d+[MY]"))
                       return $node
    let $durationHMS := for $node in $duration
                         where (matches($node,"PT\d+[MHS]"))
                         return $node
    let $durationD := for $node in $duration
                          where (matches($node,"P\d+D"))
                          return $node
    let $durationD := if (count($durationD) > 1)
                          then concat("P",xs:string(xs:integer(ig:extract($durationD[1],"\d+"))
                                                    + xs:integer(ig:extract($durationD[2],"\d+"))),"D")
                          else $durationD
    let $durationOfYM := string-join(distinct-values($durationYM),"")
    let $durationOfYM := if (string-length($durationOfYM) > 0)
                             then concat("P",replace($durationOfYM,"P",""))
                             else ""
    let $durationOfDHMS := concat($durationD,string-join(distinct-values($durationHMS),""))
    let $durationOfDHMS := if (string-length($durationOfDHMS) > 0)
                               then
                                   if (contains($durationOfDHMS,"D"))
                                       then
                                           if (matches($durationOfDHMS,"PT"))
                                               then replace(replace($durationOfDHMS,"PT",""),"D","DT")
                                               else $durationOfDHMS
                                       else concat("PT",replace($durationOfDHMS,"PT",""))
                               else ""
    let $TempmodTs := if (string-length($durationOfYM) > 0)
                      then ig:current-dateTime-adjusted() - xs:yearMonthDuration($durationOfYM)
                      else ig:current-dateTime-adjusted()
    let $modTs := if (string-length($durationOfDHMS) > 0)
                      then $TempmodTs - xs:dayTimeDuration($durationOfDHMS)
                      else $TempmodTs
    let $modTs := if ((string-length($durationOfDHMS) = 0) and (string-length($durationOfYM) = 0))
                      then ""
                      else $modTs
    let $tl := tokenize( string($modTs), "[^\d]+" )
    let $timePattern := normalize-space( replace( $timePattern, "[^dMyHms]", " " ) )
    let $tlS := if( count($tl) > 0 )
                then    replace( replace( replace( replace( replace( replace( $timePattern, "[d]+", $tl[3] ), "[M]+", $tl[2]), "[y]+", $tl[1] ),
                                "[H]+", $tl[4] ), "[m]+", $tl[5] ), "[s]+", $tl[6] )
                else    $timestamp
    return string($tlS)
};

declare function t:translateNonNumeric($timestamp as xs:string) as xs:string
{
    let $lang := t:getLanguage()
    let $ts := lower-case($timestamp)
    
    let $translated :=
        tokenize(string-join( 
        for $mNode in $lang/nonNumeric return
            let $m := lower-case($mNode/text())
            return
            if( matches($ts, $m) ) 
              then concat(  replace($ts, $m, string($mNode/@value)), "#")
              else ""
              , "" ), "#" )[1]

    return if( string-length($translated) < 1 )
           then $timestamp
           else ig:nsj($translated)
};

declare function t:translateMonth($timestamp as xs:string, $lang as node() )  as xs:string {
    
    let $ts := lower-case($timestamp)
    
    let $translated :=
        tokenize(string-join( 
        for $mNode in $lang/month return
            let $m := lower-case($mNode/text())
            return
            if( matches($ts, $m) ) 
              then concat(  replace($ts, $m, string($mNode/@value)), "#")
              else ""
              , "" ), "#" )[1]

    return if( string-length($translated) < 1 )
           then $timestamp
           else $translated    
};
declare function functx:day-of-week( $date as xs:anyAtomicType? )  as xs:integer? {
       
  if (empty($date))
  then ()
  else xs:integer((xs:date($date) - xs:date('1901-01-06'))
          div xs:dayTimeDuration('P1D')) mod 7
 } ;
declare function t:translateDayOfWeek($timestamp as xs:string) as xs:string
{
    let $lang := t:getLanguage()
    let $ts := lower-case($timestamp)
    
    let $current-time := ig:current-dateTime-adjusted()
    let $currentTofwd := functx:day-of-week($current-time)
    
    let $tOfwd := string-join(
    for $mNode in $lang/dayofweek
    let $m := lower-case($mNode/text())
    return if(matches($ts, $m))
                    then string($mNode/@value)
                    else '','')

    let $rawtimestamp := if(string-length(ig:nsj($tOfwd)) < 1)
                            then $timestamp
                            else if(xs:integer(ig:nsj($tOfwd)) >= $currentTofwd)
                                    then replace('n days ago','n',xs:string($currentTofwd +7-xs:integer(ig:nsj($tOfwd))))
                                    else replace('n days ago','n',xs:string($currentTofwd - xs:integer(ig:nsj($tOfwd))))
    return $rawtimestamp

};

declare function t:generateCommentTime($blogInfo as node()*) as xs:string
{
    let $date  := ig:extract($blogInfo/timestamp, "\d{2}-\d{2}-\d{4}")
    let $index := xs:integer($blogInfo/index)
    
    return if (matches($blogInfo/timestamp, "00-00-00")) then
        ig:generateTime($date, $index, 1, 100)
    else
        error(xs:QName('t:generateTime'), "Post time error if generate comment time.")
};
(:BETA BOILERPLATE CODE - END:)

(:BOILERPLATE CODE - START:)

declare function zf:yearPadding($finishedTimestamp as xs:string) as xs:string
{
    let $yearIndex := 3
    
    let $yearList := tokenize($finishedTimestamp, " ") 
    
    let $year      := ($yearList)[$yearIndex]
    
    return if(not(string-length($year) >2)) 
        then   
            let $paddedYear := concat("20",$year)
            
            let $paddedTimestamp := concat(($yearList)[1], " " ,($yearList)[2], " " ,$paddedYear, " " ,($yearList)[4], " " ,($yearList)[5], " " ,($yearList)[6])
            
            return $paddedTimestamp
        
        else
            $finishedTimestamp
};

declare function zf:timestampToDateTime($timestamp as xs:string) as xs:dateTime
{
    let $t := tokenize(ig:nsj(replace($timestamp, "[^0-9]", " ")), " ")
    let $timestamp := if (matches($t[1], "\d{4}"))
                      then xs:dateTime( concat($t[1],"-",$t[2],"-",$t[3], "T",$t[4],":",$t[5],":",$t[6]))
                      else if (matches($t[3], "\d{4}"))
                           then xs:dateTime( concat($t[3],"-",$t[1],"-",$t[2], "T",$t[4],":",$t[5],":",$t[6]))
                           else error(xs:QName('zf:timestampToDateTime'), "Please check the timestamp pattern!")
    let $timestamp := if(starts-with($gmtOffset,'-')) then
                           fn:adjust-dateTime-to-timezone($timestamp,
                               xs:dayTimeDuration(concat("-PT",substring-after($gmtOffset,'-'),"H")))
                     else
                            fn:adjust-dateTime-to-timezone($timestamp,
                            xs:dayTimeDuration(concat("PT",$gmtOffset,"H")))
    return $timestamp
};

(: skip posts by valid timestamp for the case of id changed :)
declare function zf:isPostSkipped( $timestamp as xs:string ) as xs:boolean
{
    let $validBlogPostTimestamp := t:validBlogPostTimePoint()
    let $validCommentTimestamp := t:validCommentTimePoint()
    let $timestamp := zf:timestampToDateTime($timestamp)
    let $skipPost := if ($useTimeLimitationOnBlogPost)
                     then if ($timestamp > zf:timestampToDateTime($validBlogPostTimestamp)) 
                          then
                              false()
                          else
                              true()
                     else if ($useTimeLimitationOnComment)
                          then if($timestamp > zf:timestampToDateTime($validCommentTimestamp)) 
                               then
                                   false()
                               else
                                   true()
                          else 
                               false()
    return
          $skipPost
};

declare function zf:parseTimestamp($rawTimestamp as xs:string, $timestampRegex as xs:string) as xs:string
{

    let $timestamp := if (string-length($rawTimestamp) = 0)
                      then error(xs:QName('zf:parseTimestamp'), "IG-ERROR: string-length($timestamp) = 0")
                      else $rawTimestamp
                         
    let $amPm      := lower-case(ig:extract(lower-case($rawTimestamp),"[ap]m"))
    
    let $timestamp := ig:convertToMMddyyyy($timestamp,$timestampRegex)
                 
    let $timestamp := if (string-length($amPm) > 0)
                      then ig:covertFromAmPmTo24HourTime($timestamp,$amPm)
                      else $timestamp
    
    let $timestamp := ig:normalize-timestamp($timestamp)
    
    return zf:yearPadding($timestamp)
};

declare function zf:getBlogInfo($blogPost as node()*) as node()
{

    let $bpid := ig:getParamValueFromQuery($documentUri, "bpid", "")
    let $bpTimestamp := ig:getParamValueFromQuery($documentUri, "bptimestamp", "")
    
    let $info := 
    if( $blogPost = () or not(string-length($bpid) = 0) ) then
        <blogInfo>
            <id>{$bpid}</id>
            <timestamp>{replace($bpTimestamp, "\D", " ")}</timestamp>   
        </blogInfo>
              
      else
          let $bpid := substring-after( string(($blogPost)[1]/uri/text()), concat($validateUri,"/") )
          return <blogInfo>
                      <id>{$bpid}</id>
                      <timestamp>{replace($blogPost/timestamp/text(), "\D", "-")}</timestamp>     
                 </blogInfo>
          
    let $info := if( empty($info/id/text()) (:or ig:isEmptyString($info/id/text(),""):) ) then
                    error(xs:QName('t:getBlogInfo'), "Cannot complete the blogInfo object.")
                else
                    $info          
    return( $info )
};

declare function zf:blogpostTransientMeta($pageType as node()) as node()
{
    let $ignorePage := xs:string(node-name($pageType)) = "TRANSIENTMETA-ONLY"
    
    return
    <tMeta>
        <entry>
            <string>ignorePost</string>
            <list>
                <string>{$ignorePage}</string>
            </list>
        </entry>
    </tMeta>
};

declare function zf:commentTransientMeta($blogPost as node()*) as node() {

    <tMeta>  
        <entry>
            <string>allowEmptySubjectInComment</string>
            <list>
                <string>true</string>
            </list>
        </entry>
        {
            if(exists($blogPost) and not(empty(t:getVisitLinks())) and not(string-length(ig:nsj(t:getVisitLinks())) = 0)) 
                then
                    <entry>
                     <string>visit</string>
                         <list>
                            {   let $ignoreBlogPostParameters := "#IGNORE-PARAMETERS#"
                                let $visitLinks := t:getVisitLinks()
                                for $visitLink in $visitLinks return
                                    let $visitLink := ig:nsj($visitLink)
                                    return
                                        if(string-length($visitLink) = 0) then
                                            ()
                                        else
                                            if(matches($visitLink,$ignoreBlogPostParameters)) then
                                                <string>{replace($visitLink, $ignoreBlogPostParameters, "")}</string>
                                            else 
                                                let $blogInfo := zf:getBlogInfo($blogPost)
                                                return
                                                if(matches($visitLink,"\?")) then
                                                    <string>{$visitLink}&amp;bpid={$blogInfo/id/text()}&amp;bptimestamp={replace($blogInfo/timestamp/text(),"\D","-")}</string>
                                                else
                                                    <string>{$visitLink}?bpid={$blogInfo/id/text()}&amp;bptimestamp={replace($blogInfo/timestamp/text(),"\D","-")}</string>
                            }
                        </list>
                    </entry>
                else
                    ()
        }
    </tMeta>
    
};

declare function zf:generateAuthorId($author as xs:string) as xs:string
{
    ig:prepareForUri($author)
};

declare function zf:generateUrl() as node()
{
     <no.integrasco.domain.xml.blog.BlogPost>
        <tags/>
        <meta/>
        <transientMeta>
            <entry>
                <string>ignorePost</string>
                <list>
                    <string>true</string>
                </list>
            </entry>
           {
                if( not( empty( t:getBlogpostLinks() ) ) and not( string-length( ig:nsj( t:getBlogpostLinks() ) ) = 0 ) ) then
                    <entry>
                        <string>visit</string>
                        <list>
                            {
                                for $href in t:getBlogpostLinks() return
                                    if (exists($href))
                                    then <string>{$href}</string>
                                    else ()
                            }
                        </list>
                    </entry>  
                 else
                      ()                  
            }
            <entry>
                <string>allowEmptySubjectInComment</string>
                <list>
                    <string>true</string>
                </list>
            </entry>
        </transientMeta>
        <generalThreadEntryComments/>
    </no.integrasco.domain.xml.blog.BlogPost>
};

declare function zf:getBlogPost() as node()*
{
    let $blogPostNode   := t:getBlogPostRootNode() 
    let $message        := t:getBlogPostMessage($blogPostNode)
    
    
    return
    if(not(ig:isEmptyNode(<message>{$message}</message>)))then        
        
        let $subject        := t:getBlogPostSubject($blogPostNode)
        
        let $authorNode     := t:getBlogPostAuthorNode($blogPostNode)
        let $authorLinkNode := t:getBlogPostAuthorUrlNode($blogPostNode, $authorNode)
        let $authorLink     := t:getBlogPostAuthorUrl($authorLinkNode)
        let $authorLink     := if(matches($authorLink,"http(s){0,1}://"))
                                  then $authorLink
                                  else ''
        let $authorLink     := if( $isPostAuthorDefaulted )
                                  then ig:nsj( zf:defaultAuthor()//h:a/@href )
                                  else $authorLink
        let $author         := t:getBlogPostAuthor($blogPostNode, $authorNode, $authorLinkNode, $authorLink)
        let $author         := if( $isPostAuthorDefaulted )
                                  then ig:nsj( zf:defaultAuthor() )
                                  else ig:nsj( $author )
        let $authorId       := zf:generateAuthorId($author)       
        
        let $rawTimestamp   := t:getBlogPostRawTimestamp($blogPostNode, $authorNode)
        
        let $timestampRegex := t:getBlogPostTimestampRegex()
        
        let $rawTimestamp   := zf:translateInformalDateDescripion($rawTimestamp, $timestampRegex)
       
        let $timestamp      := zf:parseTimestamp($rawTimestamp, $timestampRegex)
        
        let $blogPostId     := t:getBlogPostId($blogPostNode, $timestamp, $subject)
 
        let $permLink := ig:removeParamValueFromQuery($documentUri, "bpid")
        let $permLink := ig:removeParamValueFromQuery($permLink, "bptimestamp")
        let $permLink := ig:removeParamValueFromQuery($permLink, "jsstate")

        return if (($useTimeLimitationOnBlogPost and not(zf:isPostSkipped($timestamp))) or not($useTimeLimitationOnBlogPost)) then
            <blogPostContent>
                <author>{$author}</author>
                <authorUri>user://{$validateUri}/{$authorId}</authorUri>
                <authorLink>{$authorLink}</authorLink>
                <subject>{$subject}</subject>
                <uri>blog://{$validateUri}/{$blogPostId}</uri> 
                <link>{$permLink}</link>       
                <timestamp>{$timestamp}</timestamp>
                <message>{$message}</message>
            </blogPostContent>
               else <IGNORE/>
    else error(xs:QName('zf:getBlogPost'), "Blog post message is empty!" )
};

declare function zf:getComments($blogPost as node()*) as element()*
{
   let $commentNodes := t:getCommentRootNodes() 
   let $sequenceNumberOffset := t:getIndexOffset()
   
   let $blogInfo := zf:getBlogInfo($blogPost)
   
   for $commentNode at $index in $commentNodes 
       let $sequenceNumber := xs:string(    $index     +      $sequenceNumberOffset   )
       let $blogInfo := ig:appendToNodeByValue( $blogInfo, "index", $sequenceNumber )
       return
       zf:parseComment($commentNode, $blogInfo)       
}; 

declare function zf:parseComment( $commentNode as node()*, $blogInfo as node()) as node()*
{ 
    let $message   := t:getCommentMessage($commentNode)
    
    return
    
    if(not(ig:isEmptyNode(<message>{$message}</message>))) then
        let $rootPostId := $blogInfo/id/text()   
        let $authorNode := t:getCommentAuthorNode($commentNode)
        let $authorLinkNode :=  t:getCommentAuthorLinkNode($commentNode, $authorNode)
        let $authorLink := t:getCommentAuthorUrl($authorLinkNode)
        
        let $authorLink := if(matches($authorLink,"http(s){0,1}://"))
                              then $authorLink
                              else ''
        
        let $author := t:getCommentAuthor($commentNode, $authorNode, $authorLinkNode, $authorLink)
        let $author := ig:nsj($author)
        let $authorId := zf:generateAuthorId($author)
        
        
        let $timestampRegex := t:getCommentTimestampRegex()
        let $rawTimestamp   := t:getCommentRawTimestamp($commentNode, $authorNode, $blogInfo)
        let $rawTimestamp   := zf:translateInformalDateDescripion($rawTimestamp, $timestampRegex)
        let $timestamp := zf:parseTimestamp($rawTimestamp, $timestampRegex)
         
        let $commentId := t:getCommentId($commentNode, $author, $authorLink, $timestamp, $blogInfo)
        
        let $permLink := t:getCommentPermLink($commentNode, $commentId)
        let $bookMark := if(matches($permLink, "#"))
                         then
                             ig:extract($permLink, "#.*")
                         else
                             ''
        let $permLink := replace($permLink,"#.+", "")                     
        let $permLink := ig:removeParamValueFromQuery($permLink, "bpid")
        let $permLink := ig:removeParamValueFromQuery($permLink, "bptimestamp")
        let $permLink := ig:removeParamValueFromQuery($permLink, "jsstate")
        let $permLink := concat($permLink, $bookMark)
        
        
        let $parentPostId := t:getCommentParentId($commentNode)
        let $parentPostUri := if(string-length($parentPostId) = 0)
                                  then
                                      ""
                                  else
                                      concat("blog://", $validateUri, "/comment/", $parentPostId)    
                                          
        return if (($useTimeLimitationOnComment and not(zf:isPostSkipped($timestamp))) or not($useTimeLimitationOnComment)) then
                <no.integrasco.domain.xml.generalthread.GeneralThreadComment>
                    <author>{$author}</author>
                    <authorLink>{$authorLink}</authorLink>
                    <authorUri>user://{$validateUri}/{$authorId}</authorUri>
                    <rootPostUri>blog://{$validateUri}/{$rootPostId}</rootPostUri>
                    <uri>blog://{$validateUri}/comment/{$commentId}</uri>
                    <link>{$permLink}</link>
                    <parentPostUri>{$parentPostUri}</parentPostUri>
                    <sequenceNumber>{$blogInfo/index/text()}</sequenceNumber>
                    <timestamp>{$timestamp}</timestamp>
                    <message>{$message}</message>
                </no.integrasco.domain.xml.generalthread.GeneralThreadComment>
               else ()
        else
            ()
};

declare function zf:getTransientMeta($blogPost as node()*, $pageType as node()) as node()*
{
    let $commentTransientMeta  := zf:commentTransientMeta($blogPost)
    let $blogpostTransientMeta := zf:blogpostTransientMeta($pageType)
    let $entries :=ig:combineNodes( "tMeta", $blogpostTransientMeta/node(), $commentTransientMeta/node())
    
    for $entry in $entries/node() return
        <entry>
            {$entry/node()}
        </entry>
};

declare function zf:getTags() as node()*
{
    let $blogPostRootNode := t:getBlogPostRootNode()

    let $tagsRoot := t:getTagsRoot($blogPostRootNode)
    let $tagUriPattern := t:getTagUriPattern()

    let $tags := $tagsRoot//h:a[ matches( @href, $tagUriPattern ) ]
    
    return
    for $tag in $tags  where not(empty($tag)) return
        let $tagName    := ig:nsj($tag)
        return if(string-length($tagName) > 0 ) then
            <no.integrasco.domain.xml.blog.Tag>                       
                <tag>{$tagName}</tag>
            </no.integrasco.domain.xml.blog.Tag>
        else
            ()  
};

declare function zf:generateOutputBasedOnPageType($includeBlogPost as xs:boolean, $includeComments as xs:boolean ) as node()
{
    let $blogPost := if($includeBlogPost and (not(zf:getBlogPost() = <IGNORE/>)))
                         then zf:getBlogPost()
                         else ()  
                              
    let $comments := if($includeComments and ($includeBlogPost and (not(zf:getBlogPost() = <IGNORE/>))))
                         then zf:getComments($blogPost)
                         else if ($includeComments and not($includeBlogPost)) 
                              then zf:getComments($blogPost)
                              else ()
                         
    let $tags     := if($includeBlogPost and (not(zf:getBlogPost() = <IGNORE/>)))
                         then zf:getTags()
                         else ()  
                         
    let $pageType := if (empty($blogPost) and empty($comments))
                         then <TRANSIENTMETA-ONLY/> 
                         else t:getPageType()
    
    return                    
        <no.integrasco.domain.xml.blog.BlogPost>
            {$blogPost/node()}                 
            <tags>{$tags}</tags>
            <meta/>
            <transientMeta>{zf:getTransientMeta($blogPost, $pageType)}</transientMeta>
            <generalThreadEntryComments>{$comments}</generalThreadEntryComments>
        </no.integrasco.domain.xml.blog.BlogPost>            
};

(:This function is called inside the za:parse timestamp.
  Modify the body of this function to translate various informal descriptions of  weekdays, months, 'moments ago', etc.
  The functions used inside may also be modified.:)
declare function zf:translateInformalDateDescripion($timestamp as xs:string, $timestampRegex as xs:string) as xs:string
{
    let $language  := t:getLanguage()    
    
    let $timestamp := t:translateNonNumeric($timestamp)
    
    let $rawTimestamp := $timestamp
    
    let $timestamp := t:translateRelativeTime( $timestamp, $timestampRegex, $language)
    
    let $timePattern := if(matches($rawTimestamp, "\d{1,2}\D\d{1,2}\D\d{1,2}\D*$"))
                            then
                                "\d{1,2}\D\d{1,2}\D\d{1,2}\D*$"
                            else
                                "\d{1,2}\D\d{1,2}\D*$"
 
    let $replacePattern := "\d{1,2}\D+\d{1,2}\D+\d{1,2}\D*$"
    
    let $timestamp := if(matches($rawTimestamp,$timePattern)) then
                          if(not($rawTimestamp = $timestamp)) then
                              replace($timestamp, $replacePattern ,ig:extract($rawTimestamp,$timePattern))
                           else
                               $timestamp
                       else
                          $timestamp
    
    let $timestamp := t:translateMonth($timestamp, $language)

    return $timestamp
    
};

declare function zf:defaultAuthor() as node()
{
    <author>
        <h:a href="{concat('http://', $validateUri)}">{$validateUri}</h:a>
    </author>
};

(:This function can be used when blog's comments are sequenced by time.
  And old comments are sequenced before new comments:)
declare function d:generateCommentId($author as xs:string, $timestamp as xs:string, $blogInfo as node()*) as xs:string
{
    let $postId := $blogInfo/id
    let $index  := $blogInfo/index
    
    return
        string-join(($postId, $blogInfo/index), "_")
};

declare function d:generateBlogPostId() as xs:string
{
(:jsstate is a very special parameter that exists in the new $documentUri handled by javascript tools.:)
    let $postId             := ig:removeParamValueFromQuery($documentUri, "jsstate")
    let $postId             := replace( $postId, "https?://", "" )
    let $postId             := replace( $postId, "/$", "" )
    let $postId             := replace( $postId, "\.\w+?$", "" )
    
    let $tokenizedId        := tokenize( $postId, "/" )
    
    let $postId             := string-join(
                                  for $partId in $tokenizedId return
                                      if( $partId != $tokenizedId[1] ) then
                                              ig:prepareForUri( $partId )
                                          else
                                             ""
                              , "_" )
        
    let $postId             := replace( $postId, "%", "" )
    let $postId             := replace( $postId, "^_", "" )
    
    return
        $postId
};
(:BOILERPLATE CODE - END:)

(: CODE TO UPDATE - START :)
(:LANGUAGE - START:)
(:The function t:getLanguage()
  contains mappings of various time expressions into numeric values. Examples are : 'seconds ago',
  'january', etc.  in 'language nodes'. To get the correct language node,
  go to the wiki, and copy-paste it from there. If you cant find the 
  language you are looking for, make a new one and add it to the wiki.
  If you find new durations, or duration keys, make sure to update the 
  language node on the wiki as well.:)
declare function t:getLanguage() as node() {

    <language>
        <!--        Durations...          -->
        <duration>
            <key>(\d+)\s+secs?\s+ago</key>
            <key>(\d+)\s+seconds?\s+ago</key>
            <value>PT $1 S</value>
        </duration>
        <duration>
            <key>(\d+)\s+mins?\s+ago</key>
            <key>(\d+)\s+minutes?\s+ago</key>
            <value>PT $1 M</value>
        </duration>
        <duration>
            <key>(\d+)\s+hours?(\s+ago)?</key>
            <value>PT $1 H</value>
        </duration>
        <duration>
            <key>(\d+)\s+days?\s+ago</key>
            <value>P $1 D</value>
        </duration>
        <duration>
            <key>(\d+)\s+weeks?\s+</key>
            <value>P $1 D</value>
            <mul>7</mul>
        </duration>
        <duration>
            <key>(\d+)\s+months?\s+ago</key>
            <value>P $1 M</value>
        </duration>
        <duration>
            <key>(\d+)\s+years?\s+ago</key>
            <value>P $1 Y</value>
        </duration>

        <!--        Yesterday today          -->
        <duration>
            <key>today</key>
            <value>PT 1 S</value>
        </duration>
        <duration>
            <key>yesterday</key>
            <value>P 1 D</value>
        </duration>

        <!--        Months          -->
        <!-- Remember that the text actually support regex.. -->
        <month value="01">january</month>
        <month value="02">february</month>
        <month value="03">march</month>
        <month value="04">april</month>
        <month value="05">may</month>
        <month value="06">june</month>
        <month value="07">july</month>
        <month value="08">august</month>
        <month value="09">september</month>
        <month value="10">october</month>
        <month value="11">november</month>
        <month value="12">december</month>

        <month value="01">jan</month>
        <month value="02">feb</month>
        <month value="03">mar</month>
        <month value="04">apr</month>
        <month value="05">may</month>
        <month value="06">jun</month>
        <month value="07">jul</month>
        <month value="08">aug</month>
        <month value="09">sep</month>
        <month value="10">oct</month>
        <month value="11">nov</month>
        <month value="12">dec</month>

        <nonNumeric value =" 1 " >one</nonNumeric>
        <nonNumeric value =" 2 " >two</nonNumeric>
        <nonNumeric value =" 3 " >three</nonNumeric>
        <nonNumeric value =" 4 " >four</nonNumeric>
        <nonNumeric value =" 5 " >five</nonNumeric>
        <nonNumeric value =" 6 " >six</nonNumeric>
        <nonNumeric value =" 7 " >seven</nonNumeric>
        <nonNumeric value =" 8 " >eight</nonNumeric>
        <nonNumeric value =" 9 " >nine</nonNumeric>
        <nonNumeric value =" 10 ">ten</nonNumeric>
        
        <dayofweek value =" 1 " >monday</dayofweek>
        <dayofweek value =" 2 " >tuesday</dayofweek>
        <dayofweek value =" 3 " >wednesday</dayofweek>
        <dayofweek value =" 4 " >thursday</dayofweek>
        <dayofweek value =" 5 " >friday</dayofweek>
        <dayofweek value =" 6 " >saturday</dayofweek>
        <dayofweek value =" 7 " >sunday</dayofweek>
    </language>
};

(:LANGUAGE - END:)

(:META - START:)
(:1- May return <BLOGPOST-WITH-COMMENTS/>, <BLOGPOST/>, <COMMENTS/>, <TRANSIENTMETA-ONLY/>, <GENERATEURL-ONLY/>, <JAVASCRIPTBLOG/>
     depending on what kind of output you want. Be carefull when using the <TRANSIENTMETA-ONLY/> tag.:)
declare function t:getPageType() as node()
{
    let $pageType := <BLOGPOST-WITH-COMMENTS/>
    return
        $pageType
};

(:2 - Generate visit links here. blog post id and blog post timestamp are both
  automaticly added as parameters to the links. To omit these parameters, 
  concat the link with the string : "#IGNORE-PARAMETERS#" please remember to let it empty if no use :)
declare function t:getVisitLinks() as xs:string*
{
    ""
    
};

(:3 Just use to generate blogPostUrl , especially for the timestamp must be got from archive:)
declare function t:getBlogpostLinks() as xs:string*
{    
    ""   
};

(:4 Use time to skip old blogPosts for the case that id changed, remember the pattern should be either MM dd yyyy HH mm ss 
or yyyy-MM-dd HH:mm:ss  please remember to let it empty if no use :)
declare function t:validBlogPostTimePoint() as xs:string*
{
    ""
};

(:5 Use time to skip old comments for the case that id changed, remember the pattern should be either MM dd yyyy HH mm ss 
or yyyy-MM-dd HH:mm:ss  please remember to let it empty if no use :)
declare function t:validCommentTimePoint() as xs:string*
{
    ""
};

(:6 - the found specail character contains '\', 'å', if find more please add them here:)
declare function t:getSpecialCharacterRegex() as xs:string
{
    '\\|å'
};
(:META - END:)

(:TAGS - START:)

(:1 - Fetch the node containing all the tag links.:)
declare function t:getTagsRoot($blogPost as node()*) as node()*
{
    $rootNode//h:footer[@class="entry-meta"]
};

(:2 - Enter href pattern to recognize tag links.:)
declare function t:getTagUriPattern() as xs:string
{
    "/category/"
};
(:TAGS - END:)

(:BLOGPOST - START:)

(:1 - Fetch the node containing the blog post.:)
declare function t:getBlogPostRootNode() as node()*
{
    (:let $postRootNode := $rootNode//h:article[matches(@class, "post-\d+")]:)
    let $postRootNode := $rootNode//h:article[matches(@class, "post-\d+")]
    return
        $postRootNode 
};

(:2 - Find the blog post subject:)
declare function t:getBlogPostSubject($blogPost as node()*) as xs:string
{
    let $subject := ig:nsj( ($blogPost//h:h1)[1]/text() )
    return
        $subject
    (:let $subject := ig:nsj( ($blogPost//h:div[@class = "entry-title"]/h:h2)[1]/text() )
    return
        $subject:)
};

(:3 - Fetch the node containing blog post author information:)
declare function t:getBlogPostAuthorNode($blogPost as node()*) as node()*
{
    let $authorNode := ($rootNode//h:*[@class = "author-box-title"])[1]
    return
        $authorNode
    (:let $authorNode := ($blogPost//h:span[@class = "vcard author"])[1]
    return
        $authorNode:)
};

(:4 - Fetch the node containing the blog post author url:)
declare function t:getBlogPostAuthorUrlNode($blogPost as node()*, $authorNode as node()*) as node()*
{
    let $authorLinkNode := ($authorNode//h:a[matches(@href, "/author/")])[1]
                           
    return
        $authorLinkNode
};

(:5 - Find the blog post author url:)
declare function t:getBlogPostAuthorUrl($authorUrlNode as node()*) as xs:string
{
    let $authorUrl := ig:nsj($authorUrlNode/@href)
    
    return
        $authorUrl
};

(:6 - Find the blog post author name:)
declare function t:getBlogPostAuthor($blogPost as node()*, $authorNode as node()*, $authorLinkNode as node()*, $authorUrl as xs:string) as xs:string
{
    let $author := if ($authorNode)
                   then substring-after( ig:nsj( $authorNode//text()), "About "  )
                   else $validateUri
                   
    return
        $author    
};

(:7 - Find the blog post timestamp:)
declare function t:getBlogPostRawTimestamp($blogPost as node()*, $authorNode as node()*) as xs:string
{
    let $datetime := $blogPost//h:time[matches(@class, "entry-time")]/@datetime
    let $datetime := ig:subBefore($datetime, "+")
    let $datetime := ig:nsj($datetime)
    
    return
        $datetime
    (:let $datetime := ($blogPost//h:span[@class = "posted-on-date"])[1]//h:time[@class = "entry-date published"]/@datetime
    let $datetime := ig:subBefore($datetime, "+")
    let $datetime := ig:nsj($datetime)
    
    return
        $datetime:)
};

(:8 - Regex expression describing the current timestamp sequence.
  This regex should allways contain all the following expressions: (dd MM yyyy HH mm ss) in various order.:)
declare function t:getBlogPostTimestampRegex() as xs:string
{
    "yyyy MM dd HH mm ss"
};

(:9 - Find unique id for the blog post:)
declare function t:getBlogPostId($blogPost as node()*, $timestamp as xs:string, $subject as xs:string) as xs:string
{
    let $postId := ig:extractEx($blogPost/@class, "post-(\d+)" )
    
    return $postId
    (:let $postId := ig:extractEx( $blogPost/@id, "post-(\d+)" )
    
    return $postId:)
};

(:10 - Fetch the blog post message and refine it:)
declare function t:getBlogPostMessage($blogPost as node()*) as node()*
{
    let $messageNode := ($blogPost//h:div[matches(@class, "entry-content")])
    let $messageNode := ig:removeTagByAttribute($messageNode, "class", "printfriendly pf-alignleft")
    let $messageNode := ig:removeTagByNodes($messageNode, $messageNode//h:div[@class = "crp_related"])
    let $messageNode := ig:removeTagByNodes($messageNode, $messageNode//h:div[matches(@class, "sd-sharing-enabled")])
    let $messageNode := ig:removeTagByNodes($messageNode, $messageNode//h:div[@class = "sharedaddy sd-block sd-social sd-gplus"])
	let $messageNode := ig:removeTagByNodes($messageNode, $messageNode//h:div[@id = "jp-relatedposts"])
	let $messageNode := ig:removeTagByNodes($messageNode, $messageNode//h:strong/text()[matches(lower-case(.), "^related\s*posts:$")]/(following::node() | .))
	
	
	(: Remove useless node from message :)
    let $messageNode := ig:removeTagByNodes($messageNode, $messageNode/descendant-or-self::h:style)
    let $messageNode := ig:removeTagByNodes($messageNode, $messageNode/descendant-or-self::h:script)
    let $messageNode := ig:removeTagByNodes($messageNode, $messageNode/descendant-or-self::h:ins)
    let $messageNode := ig:removeTagByNodes($messageNode, $messageNode/descendant-or-self::node()[ig:isEmptyNode(.)])
	
    return $messageNode
    
};
(:BLOGPOST - END:)

(:COMMENTS - START:)

(:1 - If for example the current page is the 2nd comment page,
  and there are 20 comments per page, this function should
  return the value 20 for this page, 40 for the next page, etc. The final sequence number
  in the blog post output for the 2nd page will then be for the first comment:
  1 + 20 = 21. Set it to return 0 if there is no pagination.:)
declare function t:getIndexOffset() as xs:integer
{
    0
};

(:2 - Fetch the nodes containing the comments:)
declare function t:getCommentRootNodes() as node()*
{
    let $commentRootNodes := ($rootNode//h:ol[@class = "comment-list"])[1]//h:li[matches(@id, "comment-\d+")]

    return
        $commentRootNodes
};

(:3 - If the comment got a parent, return the parent's id. 
      Else return empty string:)
declare function t:getCommentParentId($comment as node()*) as xs:string 
{
    let $parentId := $comment//parent::h:ul[@class = "children"]/parent::h:li[matches(@id,"comment-\d+")]
    let $parentId := if($parentId)
                     then ig:extractEx($parentId/@id, "comment-(\d+)")
                     else ""
    return
        $parentId
};

(:4 - Fetch the node containing comment author information:)
declare function t:getCommentAuthorNode($comment as node()*) as node()*
{
    let $commentAuthorNode := ($comment//h:p[@class="comment-author"]/h:span[@itemprop="name"])
    return
        $commentAuthorNode
};

(:5 - Fetch the node containing the author link:)
declare function t:getCommentAuthorLinkNode($comment as node()*, $authorNode as node()*) as node()*
{
    let $commentAuthorLinkNode := $authorNode/h:a[@href]
    return
        $commentAuthorLinkNode
};

(:6 - Find the comment author url:)
declare function t:getCommentAuthorUrl($authorLinkNode as node()*) as xs:string
{
    let $commentAuthorUrl := ig:nsj($authorLinkNode/@href)
    return
        $commentAuthorUrl
};

(:7 - Find the comment author name:)
declare function t:getCommentAuthor($comment as node()*, $authorNode as node()*, $authorLinkNode as node()*, $authorUrl as xs:string) as xs:string
{
    let $commentAuthor := if($authorLinkNode)
                          then let $author := ig:nsj($authorLinkNode/text())
                               let $author := replace($author, "^@", "")
                               return
                                   $author
                          else ig:nsj($authorNode//text())
    return
        $commentAuthor
};

(:8 - Find the raw comment timestamp:)
declare function t:getCommentRawTimestamp($comment as node()*, $authorNode as node()*, $blogInfo as node()*) as xs:string
{
    let $commentRawTimestamp := ig:nsj( ($comment//h:time[@class="comment-time"])/@datetime )
    return
        $commentRawTimestamp
};

(:9 - Regex expression describing the current timestamp sequence.
  This regex should allways contain all the following expressions: (dd MM yyyy HH mm ss) in various order.:)
declare function t:getCommentTimestampRegex() as xs:string
{
    "yyyy MM dd HH mm ss"
};

(:10 - Find/generate unique id for each comment.
       To fetch the comment-index, enter $blogInfo/index/text():)
declare function t:getCommentId($comment as node()*, $author as xs:string, $authorUrl as xs:string, $timestamp as xs:string, $blogInfo as node()*) as xs:string
{
    let $commentId := ig:extractEx($comment/@id, "comment-(\d+)")
    return
        $commentId
};

(:11 - Find/generate the comment perm link:)
declare function t:getCommentPermLink($comment as node()*, $commentId as xs:string)as xs:string
{
    let $commentPermLink := concat($documentUri,"#comment-",$commentId)
    return
        $commentPermLink
};

(:12 Find and refine the comment message:)
declare function t:getCommentMessage($comment as node()*) as node()*
{
    let $commentMessage := ($comment//h:div[@class="comment-content"])
    return
        $commentMessage
};
(: COMMENTS - END:)

(: CODE TO UPDATE - END :)

<no.integrasco.domain.xml.blog.BlogPosts>
    <generalThreadEntries>              
            {
                let $pageType := xs:string(node-name(t:getPageType()))
    
                return
                if($pageType = "BLOGPOST-WITH-COMMENTS") then zf:generateOutputBasedOnPageType(true(),true())
                else
                if($pageType = "BLOGPOST") then zf:generateOutputBasedOnPageType(true(),false())
                else
                if($pageType = "COMMENTS") then zf:generateOutputBasedOnPageType(false(),true())
                else
                if($pageType = "TRANSIENTMETA-ONLY") then zf:generateOutputBasedOnPageType(false(),false())                
                else
                if($pageType = "GENERATEURL-ONLY") then zf:generateUrl()
                else
                if($pageType = "JAVASCRIPTBLOG") then if(matches($documentUri,"jsstate="))
                                                      then zf:generateOutputBasedOnPageType(true(),true()) 
                                                      else zf:generateOutputBasedOnPageType(true(),false())
                else
                    error(xs:QName('zf:generatePageOutput'), "Failed to classify page type." )
            }     
    </generalThreadEntries>
</no.integrasco.domain.xml.blog.BlogPosts>