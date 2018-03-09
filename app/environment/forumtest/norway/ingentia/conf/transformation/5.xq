(:TEMPLATE-URL-v1.5:)
xquery version "1.0";
declare namespace h = "http://www.w3.org/1999/xhtml";
declare namespace ig = "http://www.integrasco.no/";
declare namespace zf = "http://www.integrasco.no/forumtemplate";
declare namespace xqf = "http://www.xqueryfunctions.com";
declare namespace t = "http://www.integrasco.no/transform" ;
declare namespace d = "http://www.dian.org.cn/";
declare namespace functx="http://www.functx.com";

(: Static variables - should NOT be changed :)
declare variable $rootNode  := //h:html;
declare variable $gmtOffset := "0";
declare variable $documentUri as xs:string external;

(: Global variables :)
declare variable $validateUri := "stackoverflow.com";
declare variable $isFirstPostCountedInRepliesPerPage := false();
declare variable $forumUsesPaginationMultiplyer := false();
declare variable $checkThreadPagination := false();
declare variable $checkSubforumPagination := false();
(: Use it when the threads within one year can not be filtered directly by the forum Urls  :)
declare variable $validateIfGetThreadsInOneyear := true();

(:
=== URL TRANSFORMATION GUIDELINE ===

1.    Set the correct global variables

     - $validateUri                    : This is the base url that will be used to generate the
                                         validations uris.
                                         Typical if the name of the site is "http://www.emultrix.com/forums/index.php"
                                         then $validateUri should be set to "emultrix.com"

      -$forumUsesPaginationMultiplyer : If the forum uses a pagination multiplyer like: start=0, start=10, start=20,
                                        this parameter should be set to true().

      -$isFirstPostCountedInRepliesPerPage : Validate whether the First Post is contained in repliesperpage,if contains,set to true(),
                                             else ,false().

      -$checkThreadPagination         : Validate if to check t:getRepliesPerPage().When all threads are singlepage,
                                        use true(),else false().

      -$checkSubforumPagination       : Validate if to check t:getThreadsPerPage().When all subforum are singlepage,use true(),else false().

      -$validateIfGetThreadsInOneyear : Validate if call the function zf:isDateOfThreadsInOneyear,if call,use true() ,else false().

2.    Update the functions to correctly reflect the structure of the website.

3.    NAMESPACES
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
declare function  xqf:escape-for-regex( $arg as xs:string? )  as xs:string
{
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
                then	ig:subBefore( substring-after( $q, concat( "?", $param, "=") ), "&amp;" )
                else	ig:subBefore( substring-after( $q, concat( "&amp;", $param, "=") ), "&amp;" )
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

declare function ig:nsj( $text as xs:string* ) as xs:string
{
    let $string := ig:normalize-space( string-join( $text, "") )
    return $string
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
declare function ig:normalize-space( $string as xs:string ) as xs:string
{
    let $string := if(string-length($string)!=0)then
                        normalize-space( replace( $string, "&#160;|&#194;", " " ) )
                        else $string
    return $string
};

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

declare function functx:is-node-in-sequence-deep-equal( $node as node()? , $seq as node()* ) as xs:boolean 
{
    some $nodeInSeq in $seq satisfies deep-equal($nodeInSeq,$node)
};

(:$child is the key nodes to distinct $ancestor, then resturn the distinct ancestor nodes:)
declare function ig:distinctNodesByChild($child as node()*, $ancestor as node()*) as node()*
{
    for $seq in (1 to count($ancestor))
    return $ancestor[$seq][not(functx:is-node-in-sequence-deep-equal( $child[$seq],
                                                                    $child[position() < $seq]))]
};

declare function ig:current-dateTime-adjusted() as xs:dateTime {
     if(starts-with($gmtOffset,'-'))
     then   fn:adjust-dateTime-to-timezone(current-dateTime(),
                xs:dayTimeDuration(concat("-PT",substring-after($gmtOffset,'-'),"H")))
     else
            fn:adjust-dateTime-to-timezone(current-dateTime(),
                xs:dayTimeDuration(concat("PT",$gmtOffset,"H")))
};

declare function ig:convertToMMddyyyy( $timestamp as xs:string*, $datePattern as xs:string* ) as xs:string* {

  let $dayExp			:=	"(dd|d)"
  let $monthExp		:=	"(MM|M)"
  let $yearExp		:=	"(yyyy|yy)"
  let $hourExp		:=	"(HH|hh|H|h)"
  let $minuteExp		:=	"(mm|m)"
  let $secondExp		:=	"(ss|s)"

  let	$stampList		:=	tokenize( normalize-space( replace( $timestamp, "\D", " " ) ), "\D" )
  let $dpList			:=	tokenize( $datePattern, "\W")
  let $indexList		:=	for $dp in $dpList
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

(: check the timestamp if from future, and recover the timestamp that from future :)
(: $timestamp : the last result from function parseTimetamp(), and the timestamp must match pattern "MM dd yyyy HH mm ss" :)
declare function ig:covertFromAmPmTo24HourTime( $time as xs:string*, $amPm as xs:string* ) as xs:string* {

  (: strip input timestamp for nonvalid chars and tokenize it to a list :)
    let $tl 			:= 	tokenize( normalize-space(replace($time, "\D", " ")), " " )

    (: extraxt all datetime param. :)
    let $year			:= 	$tl[3]
    let $month    		:= 	$tl[1]
    let $day	  		:= 	$tl[2]
    let $hours    		:= 	$tl[4]
    let $mins     		:= 	$tl[5]
    let $sec     		:= 	$tl[6]

    (: check if valid:)
    return if( ( string-length( $amPm ) > 0 ) and ( string-length( $year ) > 0 ) and ( string-length( $month ) > 0 ) and ( string-length( $day ) > 0 ) and ( string-length( $hours ) > 0 ) ) then

      let $year			:= 	$year cast as xs:integer
      let $month    		:= 	$month cast as xs:integer
      let $day	  		:= 	$day cast as xs:integer
      let $hours	  		:= 	$hours cast as xs:integer

      (: Check if timestamp is pm  pm :)
      let $isPm			:=	if( matches( $amPm, "pm" ) ) then true() else false()
      let $isAm			:=	if( matches( $amPm, "am" ) ) then true() else false()

      let $hours    		:=	if( $isPm and not($hours = 12 ) ) then
                              $hours + 12
                            else if( $isAm and ($hours = 12 ) ) then
                              0
                           else $hours


      (: Increments the date if hour is 12 pm  and creates a new timestamp :)
      let $newStamp 		:=	concat(
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
    concat("Timestamp not valid: ", $time )
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

(:FOR URL ONLY - START:)
(:FOR URL ONLY - END:)
(:LIBRARY - END:)


(:BOILERPLATE CODE - START:)
declare function zf:validateThreads($threads as node()*)
{
    let $allowPatterns := t:getAllowedThreadUriPatterns()

    let $allLinksOnPage := distinct-values($rootNode//h:a[@href]/@href)

    let $numberOfLinkMatches :=
        for $link  in  $allLinksOnPage
            let $ok :=
                for $allowPattern in  $allowPatterns return
                    if(matches(xs:string($link),$allowPattern))
                        then 1
                        else 0
             return
                 if(sum($ok) > 0)
                     then 1
                     else 0
     let $numberOfLinkMatches := sum($numberOfLinkMatches)
     let $numberOfThreads := count($threads/node())



    return
        if(($numberOfThreads < t:getNumberOfThreadsThreshold()) and ($numberOfLinkMatches > t:getPatternMatchesThreshold()))
                     then error(xs:QName('zf:validateThreads'), "Number of threads deviates from threshold" )
                     else $threads

};

declare function zf:checkUrlListForDuplicates($urlList as node()*) as node()*
{
    let $numberOfUrls := count($urlList)
    let $numberOfDistinctUrls := count(distinct-values($urlList/text()))

    return
        if( abs($numberOfUrls - $numberOfDistinctUrls ) > 0)
            then error(xs:QName('zf:checkUrlListForDuplicates'), "Duplicates in url list!" )
            else $urlList
};

declare function zf:getThreads($threadNodes as node()*) as node()*
{
    for $threadNode in $threadNodes
    return zf:parseThread($threadNode)

};

declare function d:isDateOfThreadsInOneyear($threadNode as node())
{
     let $rawtimestamp := zf:parseTimestamp($threadNode)
     
     return
        if(string-length($rawtimestamp) > 0) then
            let $rawtimestamp := replace($rawtimestamp,"(\d{2}) (\d{2}) (\d{4}) (\d{2}) (\d{2}) (\d{2})","$3-$1-$2T$4:$5:$6")
            let $threadsDate := xs:dateTime($rawtimestamp)
            return
                if(ig:current-dateTime-adjusted() - xs:yearMonthDuration("P1Y0M") > $threadsDate)
                    then false()
                else true()
        else
           true()
};

(:when forum is descent, this function would be better replaced by the one special for that case. you can find the function on git. path:template/extrafunction:)
declare function zf:parseThread($threadNode as node()) as node()*
{
    let $threadLink := t:getThreadLink($threadNode)

    let $threadId := t:getThreadId($threadNode, $threadLink)

    let $replies := zf:getReplies($threadNode, $threadLink, $threadId)

    let $lastPage := zf:getLastPageInThread($threadNode, $replies)

    return
       if($replies > -1)
            then  if(($validateIfGetThreadsInOneyear and d:isDateOfThreadsInOneyear($threadNode)) or not($validateIfGetThreadsInOneyear))
                    then
                        for $page in (1 to ($lastPage))
                            let $paginator := if($forumUsesPaginationMultiplyer)
                                              then
                                                  $page*t:getRepliesPerPage() - t:getRepliesPerPage()
                                              else
                                                  $page

                            let $thread := t:parseThreadUrl($threadLink, $threadId, $paginator, $lastPage)

                            return
                                if ($page = $lastPage)
                                    then
                                        if(matches($thread,"\?"))
                                            then
                                                <thread>{concat($thread/node(),"&amp;replies=",$replies)}</thread>
                                            else
                                                <thread>{concat($thread/node(),"?replies=",$replies)}</thread>
                                    else
                                        <thread>{$thread/node()}</thread>
                      else ()
            else
                ()

};

declare function zf:getLastPageInThread($threadNode as node(), $replies as xs:integer) as xs:integer
{
   let $repliesprpage := t:getRepliesPerPage()

   let $lastPage := if( $isFirstPostCountedInRepliesPerPage )
                    then ((floor($replies div $repliesprpage)) cast as xs:integer) + 1
                    else if($replies=0)
                         then 1
                         else ((floor(($replies - 1) div $repliesprpage)) cast as xs:integer) + 1

   return $lastPage
};

declare function zf:getReplies($threadNode as node(), $threadLink as xs:string, $threadId as xs:string) as xs:integer
{
   let $replies := t:getRepliesNode($threadNode, $threadLink, $threadId)

   let $replies := zf:parseReplies($replies)

   return
       if ($checkThreadPagination)
       then
          if($isFirstPostCountedInRepliesPerPage)
              then if($replies < t:getRepliesPerPage())
                  then $replies
                  else error(xs:QName("t:getRepliesPerPage"),concat("found a bigger number of replies: ", xs:string($replies)))
              else if($replies > t:getRepliesPerPage())
                  then error(xs:QName("t:getRepliesPerPage"),concat("found a bigger number of replies: ", xs:string($replies)))
                  else $replies
       else
          $replies
};

declare function zf:parseReplies($replies as node()*) as xs:integer
{
    let $text := replace( ig:nsj($replies), "-\d+", "-1" )
    let $text := replace( $text, "\D", "" )
    let $replies := if(not(string-length($text) = 0))
                       then xs:integer(  $text  )
                       else -1
    return $replies

};

declare function zf:getsubForumStartPage()
{
    if($forumUsesPaginationMultiplyer)
       then
           0
       else
           1
};
declare function zf:generatePageUrls() as node()*
{

    let $currentPage := zf:parseFirstAndLastPage()/currentpage/text()
    let $paginationNode := t:getPaginationNode()
    return
           if( $currentPage = zf:getsubForumStartPage() )
        then
            let $lastPage :=  zf:parseFirstAndLastPage()/lastpage/text()
            return
            if($forumUsesPaginationMultiplyer) then
                for $page in ( 2 to $lastPage)
                    let $paginator := $page*t:getThreadsPerPage() - t:getThreadsPerPage()
                    return
                        t:parsePageUrl(t:getForumId($paginationNode), t:getThreadsPerPage(), $paginator)
            else
                for $page in ( 2 to $lastPage) return
                    t:parsePageUrl(t:getForumId($paginationNode), t:getThreadsPerPage(), $page)

      else ()
};

declare function zf:parseFirstAndLastPage()
{
    let $paginationNode := if($checkSubforumPagination)
                           then d:forumSinglePageCheck()
                           else t:getPaginationNode()

    return
        if(exists($paginationNode/node()) or (xs:string(node-name($paginationNode)) = "IGNORE"))
            then
                <pages>
                    <currentpage>{t:getCurrentForumPage($paginationNode)}</currentpage>
                    <lastpage>{t:getLastForumPage($paginationNode,t:getForumId($paginationNode))}</lastpage>
                </pages>

            else
                if(xs:string(node-name($paginationNode)) = "SINGLEPAGE")
                    then
                        <pages>
                            <currentpage>{zf:getsubForumStartPage()}</currentpage>
                            <lastpage>{zf:getsubForumStartPage()}</lastpage>
                        </pages>
                    else
                        error(xs:QName('zf:parseFirstAndLastPage'), "Could not find pagination node." )
};

declare function d:forumSinglePageCheck()
{
    let $threadsPerPage := t:getThreadsPerPage()
    let $countCurrentThreads := count(t:getThreadNodes())
    return
    if ($threadsPerPage > $countCurrentThreads)
    then
        <SINGLEPAGE/>
    else
        error(xs:QName("t:getPaginationNode"),concat("Forum pagination found, threads number in this page is: ", xs:string($countCurrentThreads)))
};
(:BOILERPLATE CODE - END:)

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
    let $durationOfYM := if (string-length($durationYM) > 0)
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
    let $TempmodTs := if (string-length($durationYM) > 0)
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
(:BETA BOILERPLATE CODE - END:)

(:DATE CODE - START:)
declare function zf:yearPadding($finishedTimestamp as xs:string)
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

declare function zf:translateInformalDateDescripion($timestamp as xs:string)
{
    let $language  := t:getLanguage()

    let $timestampRegex := t:getTimestampRegex()

    let $timestamp := t:translateNonNumeric($timestamp)

    let $rawTimestamp := $timestamp

    let $timestamp := t:translateRelativeTime( $timestamp, $timestampRegex, $language)

    let $timePattern := if(matches($rawTimestamp, "\d{1,2}\D\d{1,2}\D\d{1,2}\D*$"))
                            then
                                "\d{1,2}\D\d{1,2}\D\d{1,2}\D*$"
                            else
                                "\d{1,2}\D\d{1,2}\D*$"

    let $replacePattern := "\d{1,2}\D\d{1,2}\D\d{1,2}\D*$"


    let $timestamp := if(matches($rawTimestamp,$timePattern)) then
                          if(not($rawTimestamp = $timestamp)) then
                              replace($timestamp,$replacePattern,ig:extract($rawTimestamp,$timePattern))
                           else
                               $timestamp
                       else
                          $timestamp

    let $timestamp := t:translateMonth($timestamp, $language)

    return $timestamp
};

declare function zf:parseTimestamp($threadNode as node())
{
    let $rawTimestamp :=  t:getDateOfLastMessage($threadNode)
    
    let $rawTimestamp := ig:nsj(replace($rawTimestamp, "[-_.?]", " "))

    let $rawTimestamp := zf:translateInformalDateDescripion($rawTimestamp)

    let $timestampRegex := t:getTimestampRegex()

    let $timestamp := 
        if(string-length($rawTimestamp) > 0) then
                          
            let $amPm      := lower-case(ig:extract(lower-case($rawTimestamp),"[ap]m"))

            let $timestamp := ig:convertToMMddyyyy($rawTimestamp,$timestampRegex)

            let $timestamp := if(string-length($amPm) > 0)
                        then
                            ig:covertFromAmPmTo24HourTime($timestamp,$amPm)
                        else
                            $timestamp

            let $timestamp := ig:normalize-timestamp($timestamp)

            return zf:yearPadding($timestamp)
        else
            ""
     return $timestamp
};
(:DATE CODE - END:)

(: CODE TO UPDATE - START :)
(:LANGUAGENODES - START:)
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
            <key>(\d+)\s+years?(\s+ago)?</key>
            <value>P $1 Y</value>
        </duration>
        <duration>
            <key>(\d+)\s+months?(\s+ago)?</key>
            <value>P $1 M</value>
        </duration>
        <duration>
            <key>(\d+)\s+days?(\s+ago)?</key>
            <value>P $1 D</value>
        </duration>
        <duration>
            <key>(\d+)\s+weeks?(\s+ago)?</key>
            <value>P $1 D</value>
            <mul>7</mul>
        </duration>
        <duration>
            <key>(\d+)\s+hours?(\s+ago)?</key>
            <value>PT $1 H</value>
        </duration>
        <duration>
            <key>(\d+)\s+mins?(\s+ago)?</key>
            <key>(\d+)\s+minutes?(\s+ago)?</key>
            <value>PT $1 M</value>
        </duration>
        <duration>
            <key>(\d+)\s+secs?\s+ago</key>
            <key>(\d+)\s+seconds?\s+ago</key>
            <value>PT $1 S</value>
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
    </language>
};

(:LANGUAGENODES - END:)

(:THREAD CODE - START :)
(:1 - the found specail character contains '\', 'å', if find more please add them here:)
declare function t:getSpecialCharacterRegex() as xs:string
{
    '\\|å'
};

(:2 - Uri pattern for thread validation:)
declare function t:getAllowedThreadUriPatterns() as xs:string
{
    ("http://stackoverflow.com/questions/\d+/(\w*)(-\w*)*")       
};

                                 
(:3 - NumberOfThreadsThreshold: This is the minimum of threads that the
      url transformation must output. To mimic the old behavior set it to
      '0' - i.e everything goes If you want to disallow empty url transformations
      set it to '1' or more:)
declare function t:getNumberOfThreadsThreshold() as xs:integer
{
    1
};

(:4 - This is the threshold assosiated with the links that passes the regex patterns specified by
      t:getAllowedThreadUriPatterns(). Typical '3':)
declare function t:getPatternMatchesThreshold() as xs:integer
{
    3
};

(:5 - Replies per thread page:)
declare function t:getRepliesPerPage() as xs:integer
{
    30
};

(:6 - Node collection containing thread uri, replies, etc.. :) 
declare function t:getThreadNodes() as node()*
{
    let $threadNode := $rootNode//h:div[matches(@id, "question-summary-\d+")]
    return $threadNode
};  

(:7 - Fetch the threadlink inside the thread node:)
declare function t:getThreadLink($threadNode as node()) as xs:string
{
    let $threadLink := ($threadNode//h:a[@class = "question-hyperlink"])[1]/@href
    let $threadLink := ig:resolveUri($threadLink, "http://stackoverflow.com/")
    
    return $threadLink
};

(:8 - Fetch the thread id.:)
declare function t:getThreadId($threadNode as node(), $threadLink as xs:string) as xs:string
{
    let $threadId := ig:extractEx($threadNode/@id,"question-summary-(\d+)")
    
    return $threadId
};



(:9 - The node containing the replies number:)
declare function t:getRepliesNode($threadNode as node(), $threadLink as xs:string, $threadId as xs:string) as node()*
{
    let $replies := ($threadNode//h:div[@class = "stats"]//h:div[matches(@class, "status") and matches(@class, "(un)*answered")])[1]
    return
        $replies
};

(:10 - Generate the thread url's
      This function should return the urls WITHOUT the 'replies' parameter.
      This parameter is automaticly added before output. If the forum you're working on have pagination like: start = 20, 30, 40 etc,
      and you have set the $forumUsesPaginationMultiplyer := true(), the $page parameter passed to this function will have the correct values
      when the function is called ex: 0, 10,20,30 etc.:)
declare function t:parseThreadUrl($threadLink as xs:string, $threadId as xs:string,  $page as xs:integer, $lastPage as xs:integer) as node()
{
    let $threadUrl := ig:setParamValueFromQuery($threadLink, "page", xs:string($page))
    
    return
        <thread>{$threadUrl}</thread>
};

(:11 - Get the year of the thread:)
declare function t:getDateOfLastMessage($threadNode as node()) as xs:string
{
   let $date := ig:nsj(($threadNode//h:span[@class = "relativetime"])[1]/@title)
   return
       $date
};

(:12 - regex expression describing the current timestamp sequence.
  This regex should allways contain all the following expressions: (dd MM yyyy HH mm ss) in various order. :)
declare function t:getTimestampRegex() as xs:string
{
    "yyyy MM dd HH mm ss"
};
(:THREAD CODE - END :)



(:PAGE CODE - START :)

(:1 - Fetch the forum id:)
declare function t:getForumId($paginationNode as node()*) as xs:string
{
     ""
};

(:2 - Enter the number of threads per page:)
declare function t:getThreadsPerPage() as xs:integer
{
     15
};


(:3 - Fetch the navigation bar node.
      Set this function to return <IGNORE/> if you dont need the pagination node in order
      to get the current and last page.
      If the function returns <SINGLEPAGE/>, current page and last page are both set to t:getSubForumStartPage() :)
declare function t:getPaginationNode() as node()*
{
    let $forumId := t:getForumId(())
    let $a := $rootNode//h:div[@class = "pager fl"]//h:a[matches(@href, "/questions/")]/@href
    let $pages := for $link in $a return xs:integer(ig:getParamValueFromQuery($link, "page", "1"))
    let $lastPage := max($pages)
     
    return if( count($a) > 0)
            then
                <p>{$lastPage}</p>
            else
                <SINGLEPAGE/>
};


(:4 - Fetch the the current page. If the forum uses a pagination multiplyer like:
      start=0, start=10, start=20, etc, this function should still return the raw parameter.
      If this is the case, remember to set the $forumUsesPaginationMultiplyer := true().
      If you receive an empty page link list, the return value of this function is often
      the cause.:)
declare function t:getCurrentForumPage($paginationNode as node()*) as xs:integer
{
    let $currentPage := xs:integer(ig:getParamValueFromQuery($documentUri, "page", "1"))
    
    return xs:integer($currentPage)
};

(:5 - Fetch the last page on the subforum:)
declare function t:getLastForumPage($paginationNode as node()*, $forumId as xs:string) as xs:integer
{
    xs:integer( $paginationNode/text() ) 
};

(:6 - Generate the page url's. If the forum uses a pagination multiplyer like:
      start=0, start=10, start=20, etc, this function should still return the raw parameter.
      If this is the case, remember to set the $forumUsesPaginationMultiplyer := true():)
declare function t:parsePageUrl($forumId as xs:string, $threadsPerPage as xs:integer, $page as xs:integer) as node()
{
    let $forumUrl := ig:setParamValueFromQuery($documentUri, "page", xs:string($page))
    
    return
        <page>{$forumUrl}</page>
};
(:PAGE CODE - END :)

(: CODE TO UPDATE - END :)
                      
<forum>
    <threads>
        {
           let $threadNodes := t:getThreadNodes()		   
		   let $threads     := zf:getThreads($threadNodes)
		   
		   let $threads := zf:checkUrlListForDuplicates($threads)
		   
		   let $threads := zf:validateThreads($threads)
		   
		   return
		       $threads
		} 
    </threads>
    <pages>
		{   
		    let $pages := zf:generatePageUrls()
		    
		    let $pages := zf:checkUrlListForDuplicates($pages) 
		    
		    return $pages
		}
			      
	</pages>
</forum>
