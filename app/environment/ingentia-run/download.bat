@echo off

set Url="https://www.mybusiness.com.au/human-resources"
set Encoding="UTF-8"
set filename=fastcompany.com

del  logs\cleanedump.log
del  download.xml
del  download.html

java -jar ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar -c clean tagsoup %Url% %Encoding%

copy logs\cleanedump.log download.xml
copy logs\cleanedump.log download.html

pause