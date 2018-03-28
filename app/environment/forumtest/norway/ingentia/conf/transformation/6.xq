(:TEMPLATE-THREAD-v1.7:)
xquery version "1.0";
declare namespace h = "http://www.w3.org/1999/xhtml";
declare namespace xs = "http://www.w3.org/2001/XMLSchema";
declare namespace ig = "http://www.integrasco.no/";
declare namespace xqf = "http://www.xqueryfunctions.com" ;
declare namespace t = "http://www.integrasco.no/transform" ;
declare namespace zf = "http://integrasco.no/";
declare namespace d = "http://www.dian.org.cn/";
declare namespace functx="http://www.functx.com";

(: Static variables - should NOT be changed :)
declare variable $documentUri as xs:string external;
declare variable $gmtOffset as xs:string external;
declare variable $rootNode := //h:html;

(: Global variables :)
declare variable $validateUri := "omlet.co.uk";
declare variable $anonymousAuthorName := "guest";
declare variable $validateSequentialTimestamps := true();
declare variable $validateFromFutureTimestamps := true();
declare variable $forumUsesPaginationMultiplyer := false();
declare variable $useTimeLimitationOnPost := true();


(:
=== THREAD TRANSFORMATION GUIDELINE ===

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


      -$validateSequentialTimestamps  : This variable should have the value : true() if you want to check that the
                                        timestamps are sequential. Else, set this variable to false().

      -$forumUsesPaginationMultiplyer : If the forum uses a pagination multiplyer like: start=0, start=10, start=20,
                                        this parameter should be set to true().

      -$validateFromFutureTimestamps  : control if check and recover timestamp from future cause by today.if it is, set to true(),
                                        else false().

      -$useTimeLimitationOnPost       : control if the time limitation should be used to avoid duplicated posts due to id changed.
      
2.    Update the functions to correctly reflect the structure of the website.

3.     NAMESPACES
       Here are the internal namespaces being used with a short explanation:
       ig = "http://www.integrasco.no/";            --: Functions that are of high enough quality and may be used outside a specific transformation
                                                        gets this namespace.
       t = "http://www.integrasco.no/transform" ;   --: Functions that are written to do a certain task in a very specific way, and does not
                                                        meet the requirements to bellong to theif(starts-with($gmtOffset,'-')) then integrasco datamanagement library, gets this namespace.
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

declare function ig:indexOfString($messagenodes as node()*,$recogniser as xs:string) as xs:integer{
(: A better function to identify some string inside a textnode :)

    let $index := for $mes in $messagenodes where (contains($mes,$recogniser)) return
                       fn:index-of($messagenodes,$mes)

    let $index := if(fn:exists($index)) then
                    $index[1]
                  else 0

    return $index
} ;

declare function ig:current-date-adjusted () as xs:date {
     if(starts-with($gmtOffset,'-')) then
       fn:adjust-dateTime-to-timezone(current-dateTime(),
xs:dayTimeDuration(concat("-PT",substring-after($gmtOffset,'-'),"H")))
cast as xs:date
     else
       fn:adjust-dateTime-to-timezone(current-dateTime(),
xs:dayTimeDuration(concat("PT",$gmtOffset,"H"))) cast as xs:date
};

declare function  xqf:escape-for-regex
  ( $arg as xs:string? )  as xs:string {


   fn:replace($arg,
           '(\.|\[|\]|\\|\||\-|\^|\$|\?|\*|\+|\{|\}|\(|\))','\\$1')
} ;

declare function ig:nsj( $text as xs:string* ) as xs:string
{
    let $string := ig:normalize-space( string-join( $text, "") )
    return $string
};

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

declare function ig:onlyRE
  ( $subject as xs:string ) as xs:boolean {

   let $boolean := if((contains($subject,'RE:') or contains($subject,'rE:') or contains($subject,'Re:') or contains($subject,'re:')) and string-length(normalize-space($subject)) = 3)then
                       'true' cast as xs:boolean
                   else 'false' cast as xs:boolean

  return $boolean
 };

declare function ig:subAfter($string as xs:string, $checkFor) as xs:string
{
    let $string := if(contains($string, $checkFor)) then substring-after($string, $checkFor) else $string

    return $string
};

declare function ig:subBefore($string as xs:string, $checkFor) as xs:string
{
    let $string := if(contains($string, $checkFor)) then substring-before($string, $checkFor) else $string

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

declare function ig:convertToMMddyyyy( $timestamp as xs:string*, $datePattern as xs:string* ) as xs:string* {

  let $dayExp           :=  "(dd|d)"
  let $monthExp     :=  "(MM|M)"
  let $yearExp      :=  "(yyyy|yy)"
  let $hourExp      :=  "(HH|hh|H|h)"
  let $minuteExp        :=  "(mm|m)"
  let $secondExp        :=  "(ss|s)"

  let   $stampList      :=  tokenize( normalize-space( replace( $timestamp, "\D", " " ) ), "\D" )
  let $dpList           :=  tokenize( $datePattern, "\W")
  let $indexList        :=  for $dp in $dpList
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

      let $year         :=  $year cast as xs:integer
      let $month            :=  $month cast as xs:integer
      let $day          :=  $day cast as xs:integer
      let $hours            :=  $hours cast as xs:integer

      (: Check if timestamp is pm  pm :)
      let $isPm         :=  if( matches( $amPm, "pm" ) ) then true() else false()
      let $isAm         :=  if( matches( $amPm, "am" ) ) then true() else false()

      let $hours            :=  if( $isPm and not($hours = 12 ) ) then
                              $hours + 12
                            else if( $isAm and ($hours = 12 ) ) then
                              0
                           else $hours


      (: Increments the date if hour is 12 pm  and creates a new timestamp :)
      let $newStamp         :=  concat(
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

declare function ig:removeTagByAttribute( $elements as node()*, $attribute as xs:string, $value as xs:string )
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

declare function ig:removeTagByValue( $elements as node()*, $text as xs:string )
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

declare function ig:removeTagByName( $elements as node()*, $name as xs:string )
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

declare function ig:normalize-space( $string as xs:string ) as xs:string
{
    let $badChars := concat( "[", codepoints-to-string( 160 ), codepoints-to-string( 8204 ), codepoints-to-string( 8205 ), "]" )
    let $string   := normalize-space( replace( $string, $badChars, " " ) )
    return $string
};

declare function ig:appendToNodeByValue( $node as node(), $name as xs:string, $append as item() ) as node()
{
    element { node-name($node) }
            {$node/node(), element {$name}{$append} }
};

declare function ig:prepareForUri( $input as xs:string ) as xs:string {

    let $input := ig:normalize-space($input)
    let $input := lower-case($input)
    let $input := encode-for-uri($input)
    let $input := replace($input, "~", "tilde")
    let $input := replace( $input, "[^-A-Za-z_0-9.%]", "" )

    return $input

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
(:
Will only use the first key that matches to calculate the ago statement.
If it matches then the entire string will be replaced - and the output will be formated
to match the $timePattern.
:)

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

(:FOR THREAD ONLY - START:)
declare function d:removeSignature($tmpmsg as node(), $sigRec as xs:string) as node()*
{
    let $index := for $mes in $tmpmsg/node()
                      where (starts-with(ig:nsj($mes),$sigRec))
                      return fn:index-of($tmpmsg/node(),$mes)
    let $index := if (exists($index))
                      then $index
                      else 0
    let $message := if ($index != 0)
                        then
                            for $m in (1 to ($index[1] - 1))
                            return ($tmpmsg/node())[$m]
                        else
                            $tmpmsg
    return
        $message
};

declare function d:fixSignature($tmpmsg as node()*, $sigRec as xs:string) as node()*
{
    let $index := for $node in $tmpmsg
                      return
                          for $temp in $node//node()
                          where (starts-with(ig:nsj($temp/text()),$sigRec))
                              return fn:index-of($tmpmsg,$node)
    let $index := if (exists($index))
                      then $index
                      else count($tmpmsg)
    let $a := for $m in (1 to $index[1])
                  return $tmpmsg[$m]
    let $message := for $node in $a
                         return
                             if (contains(ig:nsj($node//text()),$sigRec))
                                 then
                                     if (contains(ig:nsj($node/text()),$sigRec))
                                         then d:removeSignature($node,$sigRec)
                                         else d:fixSignature($node/node(),$sigRec)
                                 else
                                     $node
    return
        $message
};

declare function d:refineSubject($subject as xs:string) as xs:string
{
    let $result := if (matches($subject,"^\s*[Rr][Ee]\s*:?\s*$"))
                       then concat($validateUri," : No Title")
                       else $subject
    return
        $result
};
(:FOR THREAD ONLY - END:)
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
(:BETA BOILERPLATE CODE - END:)

(:BOILERPLATE CODE - START:)
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

(: check the timestamp if from future, and recover the timestamp that from future :)
(: $timestamp : the last result from function parseTimetamp(), and the timestamp must match pattern "MM dd yyyy HH mm ss" :)
declare function zf:dealingFutureDatetime( $timestamp as xs:string ) as xs:string
{
    let $timestamp := zf:timestampToDateTime($timestamp)
    let $timestamp := if( $timestamp - current-dateTime() >= xs:dayTimeDuration('PT0H') and $timestamp - current-dateTime() < xs:dayTimeDuration('PT24H') ) then
                          $timestamp - xs:dayTimeDuration('P1D')
                      else
                          $timestamp
    let $Item      := tokenize( string( $timestamp ), "\D" )
    let $timestamp := concat( $Item[2], " ", $Item[3], " ", $Item[1], " ", $Item[4], " ", $Item[5], " ", $Item[6] )
    return
        $timestamp
};

declare function zf:parseTimestamp($post as node(), $index as xs:string)
{
    let $rawTimestamp := t:getRawTimestamp($post,t:getAuthorNode($post), xs:integer($index))

    let $rawTimestamp := zf:translateInformalDateDescripion($rawTimestamp)

    let $timestampRegex := t:getTimestampRegex()

    let $rawTimestamp := if(string-length($rawTimestamp) = 0)then
                             error(xs:QName('zf:parseTimestamp'), "IG-ERROR: string-length($timestamp) = 0")
                         else $rawTimestamp
    let $amPm      := lower-case(ig:extract(lower-case($rawTimestamp),"[ap]m"))

    let $timestamp := ig:convertToMMddyyyy($rawTimestamp,$timestampRegex)

   let $timestamp := if(string-length($amPm) > 0)
                        then
                            ig:covertFromAmPmTo24HourTime($timestamp,$amPm)
                        else
                            $timestamp

    let $timestamp := ig:normalize-timestamp($timestamp)

     let $timestamp := zf:yearPadding($timestamp)

    let $timestamp := if( $validateFromFutureTimestamps ) then
                          zf:dealingFutureDatetime( $timestamp )
                      else
                          $timestamp
    return
        $timestamp
};

declare function zf:getsubForumStartPage()
{
    if($forumUsesPaginationMultiplyer)
       then
           0
       else
           1
};

declare function zf:getSubject($firstpost as node(), $post as node(), $postRootNode as node())
{

    let $page := t:getCurrentPage()

    let $postId := (tokenize($post//uri/node(),"/"))[last()]
    let $firstPostId := (tokenize($firstpost//uri/node(),"/"))[last()]
    let $originalFirstPostId := t:getPostId($postRootNode, "1", "1")

    let $threadSubject := t:getThreadSubject()

    let $subject :=  if(string($postId) = string($originalFirstPostId) and $page = zf:getsubForumStartPage())
                        then
                            $threadSubject
                        else
                            concat("RE: ", $threadSubject)
    let $subject := if(ig:onlyRE($subject))
                       then error(xs:QName("t:getThreadSubject"),"Get wrong subject!")
                       else $subject

     return
           $subject
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

declare function zf:notAllAuthorsAreGuests($posts as node()*)as xs:boolean
{

    let $guestTypes := $anonymousAuthorName
    let $numOfGuests := sum( for $author in $posts/author/text() return
                                       for $type in $guestTypes return
                                           if($author = $type)then
                                               1
                                           else 0 )
    return if($numOfGuests = count($posts) and count($posts) >= t:getGuestThreshold())then
                false()
           else true()
};

declare function zf:authorsAreDistinct($posts as node()*) as xs:boolean
{
    let $authors := $posts/author/text()
    let $distinctAuthors := distinct-values($authors)
    let $duplicates := count($authors) - count($distinctAuthors)

    return
        if($duplicates < t:getGuestThreshold())
            then
                true()
            else
                false()
};

declare function zf:isTimestampSequential($posts as node()*)as xs:boolean
{
    let $isTimestampSequential := zf:isTimestampSequentialRecursive(1, $posts/timestamp/text(), 0)

    return if( ($isTimestampSequential = 1) and ($validateSequentialTimestamps = true()) ) then false() else true()
};

declare function zf:isTimestampSequentialRecursive($index as
xs:integer, $timestamps as xs:string*, $returnValue as xs:integer*)as
xs:integer
{
   let $currentTimestamp := $timestamps[$index]

   return max(
       if( count($timestamps) = ($index +1) or count($timestamps) = 1 )then
            ($returnValue, 0)
       else if(
       string-length(replace($currentTimestamp,"[^0-9]","")) > 0 and
       string-length(replace($timestamps[$index +1],"[^0-9]","")) > 0)then
           if( zf:timestampToDateTime($currentTimestamp) <=
zf:timestampToDateTime($timestamps[$index +1]) )then
                zf:isTimestampSequentialRecursive($index +1,
$timestamps, ($returnValue, 0))
           else
               ($returnValue, 1)

       else ($returnValue, 1) )
};

declare function zf:isIdsUnique($posts as node()*)as xs:boolean
{
    let $ids := for $uri in $posts//uri/text() return
                    ig:subBefore(xqf:substring-after-last($uri,"/"),"/")

    let $normalizedIds := distinct-values($ids)
    return if(count($normalizedIds) = count($posts))then true()
           else false()
};

declare function zf:validatePosts($posts as node()*)
{
   if(not($useTimeLimitationOnPost) and not(t:skipedSpecialPosts()) and not(exists($posts)))then
       error(xs:QName('zf:validatePosts'), "IG-ERROR: Can not get post message." )
   else if (not($useTimeLimitationOnPost) and not(t:skipedSpecialPosts()) and not(zf:isTimestampSequential($posts))) then
       error(xs:QName('zf:validatePosts'), "IG-ERROR: Timestamps are
not sequential or string-length(replace(parsedTimestamp,'\D','')) = 0"
)
   else if (not(zf:notAllAuthorsAreGuests($posts)) ) then
       error(xs:QName('zf:validatePosts'), "IG-ERROR: All authors are
Guest, please check the xPath retreving $author" )
else if (not(zf:authorsAreDistinct($posts)) ) then
       error(xs:QName('zf:validatePosts'), "IG-ERROR: To many authors have
the same name. please check the xPath retreving $author" )
   else if (not(zf:isIdsUnique($posts)))then
       error(xs:QName('zf:validatePosts'), "IG-ERROR: The same
$postId occur more than once" )
   else
       $posts
};

declare function zf:validatePostRootNodes($postRootNodes as node()*) as node()*
{
    if ($postRootNodes)
    then $postRootNodes
    else if(exists(t:skipedSpecialPosts()))
    then ()
    else error(xs:QName('zf:validatePostRootNodes'),"IG-ERROR: Cannot get postRootNodes!")
};

declare function zf:getPosts() as node()*
{
    let $postRootNodes := t:getPostRootNodes()

    let $posts := zf:validatePostRootNodes($postRootNodes)

    let $parsedPosts :=
    for $post at $index in $posts return
        zf:parsePost($post,xs:string($index))

    return
        zf:parsePostsInGlobal($parsedPosts, $postRootNodes)
};

declare function d:validatePostUrl($postUrl as xs:string)
{
     if(not(matches($postUrl,"^http(s){0,1}://")) or string-length($postUrl)=0)
         then  error(xs:QName('t:getPostUrl'),"Get wrong postUrl!")
         else $postUrl
};

declare function d:removeTag( $elements as node()* , $nodes as node()* ) as node()*
{
       for $e in $elements except $nodes
       return if( $e instance of element() )
              then element { node-name($e) }
                            { $e/@*, d:removeTag($e/node(), $nodes) }
              else if( $e instance of document-node() ) then
                   d:removeTag($e/node(), $nodes)
              else $e
};

declare function d:removeUselessTagsInMessage($message as node()*) as node()*
{
      let $messageTag := for $node in $message//node()
                         where(ig:isEmptyNode($node))
                         return $node
      let $message := d:removeTag($message,$messageTag)
      return
          $message
};

declare function zf:parsePost($post as node()*, $index as xs:string) as node()*
{
    let $message := t:getMessage($post)

    return

    if(not(ig:isEmptyNode(<message>{$message}</message>)))then

    let $message := d:removeUselessTagsInMessage(<message>{$message}</message>)

    let $threadId := t:getThreadId($post)

    let $postId := t:getPostId($post, xs:string(t:getCurrentPage()), $index)

    let $authorNode := t:getAuthorNode($post)

    let $author := ig:normalize-space(t:getAuthor($authorNode, $post, $postId))

    let $authorUrl := t:getAuthorUrl($authorNode, $post)

    let $postUrl := t:getPostUrl($post, $postId, $threadId, xs:string(t:getCurrentPage()))

    let $datetime := zf:parseTimestamp($post, $index )


     return if (not(zf:isPostSkipped($datetime)))
            then
           <entry>
                <uri>http://{$validateUri}/{$threadId}/{$postId}</uri>
                <root>http://{$validateUri}/{$threadId}</root>
                <realurl>{$postUrl}</realurl>
                <rootrealurl>{ig:removeParamValueFromQuery($documentUri,"replies")}</rootrealurl>
                <author>{$author}</author>
                <authorrealurl>{$authorUrl}</authorrealurl>
                <authorid>{zf:generateAuthorId($author)}</authorid>
                <timestamp>{$datetime}</timestamp>
                <message>{$message/node()}</message>
          </entry>
            else ()
    else ()
};

(: skip posts by valid timestamp for the case of id changed :)
declare function zf:isPostSkipped( $timestamp as xs:string ) as xs:boolean
{
    let $validPostTimestamp := t:validPostTimePoint()
    let $timestamp := zf:timestampToDateTime($timestamp)
    let $skipPost := if ($useTimeLimitationOnPost)
                     then if ($timestamp > zf:timestampToDateTime($validPostTimestamp)) 
                          then
                              false()
                          else
                              true()
                     else 
                          false()
    return
          $skipPost
};

declare function zf:generateAuthorId($author as xs:string) as xs:string
{
     let $authorId := ig:prepareForUri($author)

     let $authorId := concat("http://",$validateUri,"/user/",$authorId)

     return
         $authorId
};

declare function zf:parsePostsInGlobal($posts as node()*, $postRootNodes as node()*) as node()*
{
    let $firstPostId := (tokenize($posts[1]//uri/text(),"/"))[last()]
    for $post at $index in $posts
     return
        <entry>

            {
             ($post/node())[position() < 5]
            }
            <subject>{zf:getSubject($posts[1], $post, $postRootNodes[1])}</subject>
            {
             ($post/node())[position() >= 5]
            }
        </entry>
};
(:BOILERPLATE CODE - END:)

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
            <key>(\d+)\s+hours?\s+ago</key>
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
            <key>oggi</key>
            <value>PT 1 S</value>
        </duration>
        <duration>
            <key>ieri</key>
            <value>P 1 D</value>
        </duration>

        <!--        Months          -->
        <!-- Remember that the text actually support regex.. -->
        <month value="01">gennaio</month>
        <month value="02">febbraio</month>
       <month value="03">marzo</month>
       <month value="04">aprile</month>
       <month value="05">maggio</month>
       <month value="06">giugno</month>
       <month value="07">luglio</month>
       <month value="08">agosto</month>
       <month value="09">settembre</month>
       <month value="10">ottobre</month>
       <month value="11">novembre</month>
       <month value="12">dicembre</month>
       <month value="01">gen</month>
       <month value="02">feb</month>
       <month value="03">mar</month>
       <month value="04">apr</month>
       <month value="05">mag</month>
       <month value="06">giu</month>
       <month value="07">lug</month>
       <month value="08">ago</month>
       <month value="09">set</month>
       <month value="10">ott</month>
       <month value="11">nov</month>
       <month value="12">dic</month>


        <nonNumeric value =" 1 " >((^\s*)|(\s+))en\s+</nonNumeric>
        <nonNumeric value =" 2 " >((^\s*)|(\s+))to\s+</nonNumeric>
        <nonNumeric value =" 3 " >((^\s*)|(\s+))tre\s+</nonNumeric>
        <nonNumeric value =" 4 " >((^\s*)|(\s+))fire\s+</nonNumeric>
        <nonNumeric value =" 5 " >((^\s*)|(\s+))fem\s+</nonNumeric>
        <nonNumeric value =" 6 " >((^\s*)|(\s+))seks\s+</nonNumeric>
        <nonNumeric value =" 7 " >((^\s*)|(\s+))syv\s+</nonNumeric>
        <nonNumeric value =" 8 " >((^\s*)|(\s+))åtte\s+</nonNumeric>
        <nonNumeric value =" 9 " >((^\s*)|(\s+))ni\s+</nonNumeric>
        <nonNumeric value =" 10 ">((^\s*)|(\s+))ti\s+</nonNumeric>

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

(:THREAD - START:)
(:1 - the found specail character contains '\', 'å', if find more please add them here:)
declare function t:getSpecialCharacterRegex() as xs:string
{
    '\\|å'
};

(:2 -Use time to skip old Posts for the case that id changed, remember the pattern should be either MM dd yyyy HH mm ss or yyyy-MM-dd HH:mm:ss :)
(: If you are not allowed to change the related global variables, please just let it empty :)
declare function t:validPostTimePoint() as xs:string*
{
    "2017-03-01 00:00:00"
};
(:3 -Fetch sign node that could exactly say no posts existing.:)
declare function t:skipedSpecialPosts() as node()*
{
    ()
};
(:4 -This integer should not be greater then posts per page.
  It is used in  zf:notAllAuthorsAreGuests to check if all
  authors are guests :)
declare function t:getGuestThreshold()as xs:integer
{
    25
};
(:5 -  Fetch the nodes containing the post elements:)
declare function t:getPostRootNodes() as node()*
{
    let $posts := $rootNode//h:article[matches(@id, "elComment_\d+")]
    
    return $posts
};

(:6 - Fetch thread id:)
declare function t:getThreadId($post as node()*) as xs:string
{
    ig:extractEx($documentUri,"topic/(\d+)-\S+")
};

(:7 - Fetch post id:)
declare function t:getPostId($post as node()*, $page as xs:string, $index as xs:string) as xs:string
{
    let $postId := ig:extract($post/@id, "\d+")
    let $postId := if($postId)
                    then $postId
                    else t:getThreadId($post)
    return $postId
};

(:8 - Fetch node with author information:)
declare function t:getAuthorNode($post as node()*) as node()
{
    let $authorNode := ($post//h:h3[contains(@class,"cAuthorPane_author")]/h:strong/h:a[@href])[1]
    let $authorNode := if(exists($authorNode))
                        then $authorNode
                        else  ($post//h:h3[contains(@class,"cAuthorPane_author")]/h:strong)[1]
    return $authorNode
};

(:9 - Fetch the author from author node:)
declare function t:getAuthor($authorNode as node()*, $post as node(), $postId as xs:string) as xs:string
{
    let $author := ig:nsj($authorNode//text())
    let $author := if(string-length($author) = 0)
                       then $anonymousAuthorName
                       else $author
    return $author
};

(:10 - Fetch author url, either from the author node, or somewhere in the post node.:)
declare function t:getAuthorUrl($authorNode as node()*, $post as node()) as xs:string*
{
    let $authorUrl := ig:nsj($authorNode/@href)
    return $authorUrl
};

(:11 - Fetch perm link to post:)
declare function t:getPostUrl($post as node()*, $postId as xs:string, $threadId as xs:string, $page as xs:string) as xs:string
{
    let $postUrl := ig:nsj(($post//h:a[matches(@id,"elSharePost_\d+")])[1]/@href)
(:    let $postUrl := ig:resolveUri($postUrl,"http://my-symbian.com/forum/"):)
    return $postUrl
};

(:12 - Fetch the thread subject:)
declare function t:getThreadSubject() as xs:string
{
    let $subject := ig:nsj( $rootNode//h:h1[@class="ipsType_pageTitle ipsContained_container"]//text() )
    let $subject := if ($subject != "")
                    then $subject
                    else ig:nsj(ig:subAfter(($rootNode//h:title)[1]//text(),"-"))
    return $subject
};

(:13 - Fetch the current thread page.
       If the forum uses a pagination multiplyer like:
       start=0, start=20, start=30, etc, this function should still return the raw parameter.
       If this is the case, remember to set the $forumUsesPaginationMultiplyer := true().:)
declare function t:getCurrentPage() as xs:integer
{
    let $currentPage := ig:getParamValueFromQuery($documentUri,"page","1")
    return if(string-length($currentPage)>0) 
            then xs:integer($currentPage)
            else 1
};

(:14 - Enter the raw timestamp From the post. Try to avoid extra text, especially extra numbers.:)
declare function t:getRawTimestamp($post as node()*, $authorNode as node(), $index as xs:integer ) as xs:string
{
    let $time := ($post//h:time[@datetime])[1]
    let $time := ig:nsj( $time/@datetime )
    (:let $time := ig:nsj(ig:subBefore(ig:subAfter($time,","),"Post subject")):)
    return ig:nsj($time)
};

(:15 - regex expression describing the current timestamp sequence.
  This regex should allways contain all the following expressions: (dd MM yyyy HH mm ss) in various order. :)
declare function t:getTimestampRegex() as xs:string
{
    "yyyy MM dd HH mm ss"
};

(:15 - Fetch the post message:)
declare function t:getMessage($post as node()*) as node()*
{
    let $message := ($post//h:div[@data-role = "commentContent"])[1]
    let $message := ig:removeTagByAttribute( $message, "class", "edit" )
    let $message := ig:removeTagByAttribute( $message, "class", "gensmall" )
    
    return $message/node()
};

(:THREAD - END:)

(: CODE TO UPDATE - END :)
<thread>
  {
      let $posts := zf:getPosts()
      let $posts := zf:validatePosts($posts)
      
      return $posts
  }
</thread>