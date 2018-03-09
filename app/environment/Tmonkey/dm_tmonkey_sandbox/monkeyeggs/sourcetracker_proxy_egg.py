# -*- coding: utf-8 -*-

import tmonkeysettings as tm
import monkeyutility as mu
import monkeyegg
import re
import os
import subprocess
import codecs
import shutil
import re
import datetime
import xmlrpclib


class SandboxEgg( monkeyegg.MonkeyEgg ):
    
    checkList = []
    
    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self)
        self._sourcelist_id = -1
        self._proxy = None  
        
    def get_commands(self):
        return [
                ( ("popjob"), self.pop_job ),
                ( ("assignjob"), self.assign_job ),
                ( ("freejob"), self.free_job ),
                ( ("jobinfo"), self.job_info ),
                ( ("addcomment"), self.add_comment ),
                ( ("commitjob"), self.commit_job ),
                ( ("discardjob"), self.discard_job ),
                ( ("getcomment"), self.get_comment ),
                ( ("testjob") , self.test_job),
                ( ("getfeedback") , self.get_feedback)
               ]
    
    def load(self):
        try:
            print "INFO: Trying to access the dm-source service. (Can take 10secs)"
            
            
            addr = "http://{0}:{1}".format(tm.DMSOURCE_RPC_ADDR, tm.DMSOURCE_RPC_PORT)
            print addr
            #self._proxy = xmlrpclib.ServerProxy("http://localhost:8091")
            self._proxy = xmlrpclib.ServerProxy(addr)
            if self._proxy.ping() != "pong":
                return False
            
            print "INFO: Connected"
            print ""
        except:
            print "Unable to connect, disable this module for now."
            return False
        
        return True
        
            
    
    def unload(self):
        self._proxy = None
    
    def pop_job(self, cmdline):
        """pops the most prioritized job
        Usage: popjob
        """

        type = mu.get_second_arg(cmdline)
        
        if( not(type == "forum" or type == "blog") and len(type) > 0 ):
            print "You did not type forum or blog correctly"
            return
        self._sourcelist_id, p, comment = self._proxy.pop_job(type)
        print p
        print "comment******************"
        print comment
        print "*************************"
        
        
    def assign_job(self, cmdline):
        """Assigns the job you just popped
        Usage: assignjob [email]"""
        email = mu.get_second_arg(cmdline)
        
        if not (self._sourcelist_id and self._sourcelist_id > 0):
            print "You must pop a job before assigning one."
            return
        
        r, p = self._proxy.assign_job(self._sourcelist_id, email)
        #
        
        if not r:
            self._print_result(r, p)
            return
        
        r2, p2 = self._proxy.is_prioritized(email)
        if r2:
            print "#" * 30            
            print "# This source is marked as high-priority."
            print "# And the finished transformation should therefore be sent"
            print "# to 'highprisources@integrasco.no' upon completion."            
            print "#" * 30             
        else:
            self._print_result(r2, p2)
        
        self._print_result(r, p)
        
    
    def commit_job(self, cmdline):
        """When finished with a job
        Usage: commitjob [email] [sourceListId] [package]
        
        note: package should archive with zip, with the following structure
        sourcename.zip
            --sourcename.xml                                         
            --sourcename.png                                           //this is logo file
            --webForumConfiguration.xml(forum)                         
            --sourcename-url.xq & sourcename-thread.xq(forum))
            --finished.xml(forum)
            --sourcename.xq(blog)
            --config.xml(blog)
            --comment.txt
        
            --sourcename.xml sample:
                <meta>
                    <name>istofsports.co.uk</name>
                    <link>http://istofsports.co.uk</link>
                    <gmt>3</gmt>
                </meta>
        """
        
        arg = mu.get_second_arg(cmdline)
        args = cmdline.strip().split();
        
        if len(args) != 4:
            print "Command not valid, see 'man commitjob' for more info."
            return False
        
        email = args[1]
        source_id = args[2];
        pack_path = args[3]
        
        print "Be patient, I hate to wait either!"
        try:
            file = open(pack_path , "rb")
            r , p = self._proxy.upload_file(os.path.basename(pack_path) , xmlrpclib.Binary(file.read()))
            self._print_result(r, p)
        except:
            print "Failed upload package to server, Check whether package is correct?"
            print "Needs commit again"
            return False
        
        is_prioritized, p2 = self._proxy.is_prioritized(arg)                            
        r, p = self._proxy.commit_job(email , source_id , os.path.basename(pack_path))    
                
        if not r:
            self._print_result(r, p)
            return
        
        # rest so assignjob will give the correct message
        self._sourcelist_id = -1
        
        
        if is_prioritized:
            print "#" * 30
            print "# The source you just committed is flagged as a high-priority."
            print "# Please send the transformation to:"
            print "# \t'highprisources@integrasco.no'"
            print "# as SOON as possible."
            print "#" * 30            
        
        self._print_result(r, p)
        
        
    
    
    def free_job(self, cmdline):
        """ This command will release your current job, making it available for others.
            Usage: freejob [@email]
                   or
                   freejob [sourcelistId]
         """
        
        second_arg = mu.get_second_arg(cmdline)
        r, p = self._proxy.free_job(second_arg)    
        self._print_result(r, p)
        
        # to make sure we have to pop a new job
        self._sourcelist_id = -1
        
       
    
    def add_comment(self, cmdline):
        """ Appends a comment tagged with supplied email and current time.
            Can append comment to your currently assigned job, or a source you identify with id.
            Usage: addcomment [@email]
            """
        email = mu.get_second_arg(cmdline)
        
        if len(email) < 3:
            print "You must provide a valid email to comment from."
            print "see 'man addcomment' for more info."
            return
                        
        print "Enter id of the source you want to add comment to. Use 'jobinfo' to get id of sources"
        print "Press 'enter' without typing to add comment to your currently assigned job"
        sourceid = str( raw_input() )
        

        
        print "Type your comment, and submit by pressing 'Enter'"
        print "-- start comment --"
        comment = str(raw_input("> "))
        print "-- end comment --"
        
        print "Do you want to add the above comment to source with id={0}?".format(str(sourceid))
        print "Type 'yes' or 'y' to accept, any other key to cancel."            
        answer = raw_input("> ")
        if(answer.lower() != "yes" and answer.lower() != "y"):
            print "Add comment canceled by user."
            return
        
        
        r, p = self._proxy.add_comment(email, sourceid, comment)    
        self._print_result(r, p)
        
        
    def get_comment(self, cmdline):
        """Will return the comment for the given sourcelistId
            Usage: getcomment [sourceListId]"""
        
        sourcelist_id = mu.get_second_arg(cmdline)

        if re.match("^\s*\d+\s*$",sourcelist_id) == None:
            print "The sourceid is not a number according to ^\s*\d+\s*$"
            return
        
        r, p = self._proxy.get_comment(sourcelist_id)    
        self._print_result(r, p)
        
        
    
    def job_info(self, cmdline):
        """ Print name and id of the provided email's current job
            Usage:
            jobinfo [@email]
         """
        email = mu.get_second_arg(cmdline)
        r, p = self._proxy.job_info(email)    
        self._print_result(r, p)

        
    def discard_job(self,cmdline):
        """ Will discard your current job. 
            Should only be used if the source is extremely difficult or contains unwanted content like for example porn.
            
            The @email is for finding the source that should be discarded, the @cause is the reason
            for discarding the source.
            
            Usage: discardjob [email] [sourceListId]"""
        if len(mu.get_second_arg(cmdline).split()) >1:
            email , sourcename = mu.get_second_arg(cmdline).split()
        else:
            print "Invalid command, Usage: discardjob [email] [sourceListId]"
            return
        print "Please enter the reason for discarding this source:"
        cause = str(raw_input("> "))
        
        if not cause or len(cause) < 2:
            print "Invalid cause given, please rerun the command with a proper cause."
            return
        
        
                    
        print "---"
        print "Discarding {1} assigned to: {0}".format(email , sourcename)
        print "Cause: '{0}'".format(cause)
        confirm = str( raw_input( "To confirm type: 'discard' without quotes: " ) )
                
        if confirm == "discard":
            self._sourcelist_id = -1
            
            r, p = self._proxy.discard_job(email , cause , sourcename)
            self._print_result(r, p)
        else:
            print "Confirmation failed - aborting."
            
    def _print_result(self, r, p):
        if r:
            print "Success:", p
        else:
            print "Failure:", p
        
    def test_job(self , cmdline):
        """Will enter test phase, allow assign new sources
            Usage: testjob [@email]"""
        
        email = mu.get_second_arg(cmdline)
        
        r, p = self._proxy.test_job(email)    
        self._print_result(r, p)
        
    def get_feedback(self , cmdline):
        """Retrieve feedback of the source from Integrasco Chengdu
        """
        
        source_id = mu.get_second_arg(cmdline)
        
        if not re.match("^\d+$" , source_id):
            print "source id must be integer"
            return 
        
        r , p = self._proxy.get_feedback(source_id)
        self._print_result(r, p)
        
        