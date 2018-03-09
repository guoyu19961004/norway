# -*- coding: utf-8 -*-

import tmonkeysettings as tm
import monkeyutility as mu
import monkeyegg
import re
import os
import subprocess
import codecs
import shutil


class CleanerEgg( monkeyegg.MonkeyEgg ):
    
    checkList = []
    
    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self);

        
    def get_commands(self):
        return [
                ( ("tagsoup"), self.clean_with_tagsoup )
               ]
    
    def load(self):
        return True;
    
    def unload(self):
        self.sql = None;
    def get_url_and_encoding(self, cmdline):
        
        url = mu.get_second_arg(cmdline).strip()
        encoding = mu.get_second_arg(url).strip()
        url = url.replace(encoding,"",1).strip()
        
        return {"url" : url, "encoding" : encoding}
        
        
    def clean_with_tagsoup(self, cmdline):
        """Cleans a html document locally or on the web. Input encoding is optionally.
            Usage: tagsoup (http://url.com/url.html | https://url.com/url.html | C:\\file\\path\\to\\file | /path/to/file ) ( INPUT-ENCODING )"""

        if len(cmdline.split()) != 3:
            print "command not valid"
            print self.clean_with_tagsoup.__doc__
            return
        
        args = self.get_url_and_encoding(cmdline)       
        
        if(len( args["url"] ) < 4):
            print "Did you forget to include the url/filepath. See man tagsoup for info"
            return
        
        self.clean(args["url"], "tagsoup", args["encoding"])
        
        print "tagsoup used to clean {0}".format(args["url"])
        
    def clean(self, url, cleaner_type, encoding):

        encoding = encoding.lower()
        print "encoding used: {0}".format(encoding)
        cmd = 'java -jar {0} {1} {2} "{3}" {4}'.format(tm.INGENTIA_JAR, tm.INGENTIA_CLEANER_PARAM, cleaner_type, url, encoding)
        
        old_cwd = os.getcwd();
        
        try:
            os.chdir(tm.INGENTIA_PATH)
            
            print "Calling: '{0}'".format(cmd)
            subprocess.call( cmd, shell=True )
        
        except KeyboardInterrupt:
            print "Skipping keyboardinterrupt"
        
        os.chdir( old_cwd )
        
        self.copy_content_of_cleandump_to_downloadedthread()
    
    
    def copy_content_of_cleandump_to_downloadedthread(self):
        """Copies the content of cleandump.log to a downloadedContent.xml file"""
        
        shutil.copy(tm.CLEAN_DUMP_PATH, tm.ECLIPSE_DOWNLOADED_PAGE_FILE)
        
        print "Dumped to {0}".format( tm.ECLIPSE_DOWNLOADED_PAGE_FILE )

    