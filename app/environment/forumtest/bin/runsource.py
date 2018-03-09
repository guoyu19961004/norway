#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import os, os.path
import re
import time
import hashlib
import shutil
import subprocess
from threading import Thread, Lock
from Queue import Queue
import xml.etree.ElementTree as et
import codecs
from xml.sax.saxutils import escape
from report import Reporter

import setting

log_locker = Lock()
SYS_ENCODING = sys.stdin.encoding


def send_gtalk(msg='Something happend in some test'):
    if setting.ENABLE_GTALK_MSG:
        from gtalk import Gtalk
        g = Gtalk(setting.GMAIL_ID, setting.GMAIL_PWD)
        g.send_msg(setting.MY_GMAIL_ID, msg)

class SubforumRunner(Thread):
    def __init__(self, name, src_name, src_dir, urls):
        Thread.__init__(self, name = name)
        self.urls = urls
        self.src_name = src_name
        self.src_dir = src_dir
        #for the log
        self.result_file = os.path.join(setting.RESULT_DIR, "%s.log" % self.src_name)

    def prepare(self):
        pass

    def copy_ingentia_resource(self):

        #ingentia dist
        temp = os.path.join(setting.TEMP_DIR, self.src_name)
        self.ingentia_dist = os.path.join(temp, 'ingentia-%s' % self.id)
        shutil.copytree(setting.INGENTIA_SRC, self.ingentia_dist)

        #xq files
        src_thread_xq = os.path.join(self.src_dir, "%s-thread.xq" % self.src_name)
        dist_thread_xq = os.path.join(self.ingentia_dist, 'conf/transformation', '6.xq')
        src_url_xq = os.path.join(self.src_dir, "%s-url.xq" % self.src_name)
        dist_url_xq = os.path.join(self.ingentia_dist, 'conf/transformation', '5.xq')

        shutil.copy(src_thread_xq, dist_thread_xq)
        shutil.copy(src_url_xq, dist_url_xq)

        #config files
        src_forum_conf = os.path.join(self.src_dir, 'webForumConfiguration.xml')
        dist_forum_conf = os.path.join(self.ingentia_dist, 'conf/configuration', 'webForumConfiguration.xml')

        shutil.copy(src_forum_conf, dist_forum_conf)

        dist_subsource_conf = os.path.join(self.ingentia_dist, 'conf/configuration', 'subSourceConfig.xml')

        subsource = '''<?xml version='1.0' encoding='UTF-8'?>
<no.integrasco.immensus.storage.domain.source.SubSource>
  <subsourceid>1</subsourceid>
  <name>%s</name>
  <uri>%s</uri>
</no.integrasco.immensus.storage.domain.source.SubSource>'''
        subsource_file = codecs.open(dist_subsource_conf, 'w', 'utf8')
        subsource_file.write(subsource % (self.src_name,  escape(self.url)))
        subsource_file.close()

    def run(self):
        while not self.urls.empty():
            self.url = self.urls.get()
            m = hashlib.md5()
            m.update(self.url.encode('utf8'))
            #generate md5 code for the source id
            self.id = m.hexdigest()
            try:
                self.run_subforum()
            except:
                exit()
            self.urls.task_done()

    def run_subforum(self):
        self.prepare()
        self.copy_ingentia_resource()
        print '%s running : %s' % (self.name, self.url)
        print 'Start to run Ingentia.'
        os.chdir(self.ingentia_dist)
        self.log_file = os.path.join(self.ingentia_dist, "logs/%s.log" % self.src_name)
        ret = subprocess.call("java -jar ingentia-test-crawler-3.0.1-SNAPSHOT-jar-with-dependencies.jar -c legacythread >> %s" % self.log_file, shell=True)
        with open(self.log_file, 'r') as log_file:
            self.write_log("\n======%s======\n\n" % self.url)
            for line in log_file:
                self.write_log(line)

    def write_log(self, msg):
        global log_locker
        log_locker.acquire()
        logfile = open(self.result_file, 'a')
        logfile.write("%s" % msg)
        logfile.close()
        log_locker.release()

class MainProcess():
    def __init__(self, src_name, src_dir, max_thread = 5):
        self.src_name = src_name
        self.src_dir = src_dir
        self.urls = Queue()
        self.max_thread = max_thread
        self.result_file = os.path.join(setting.RESULT_DIR, "%s.log" % self.src_name)
        self.report_file = os.path.join(setting.RESULT_DIR, "%s-error.html" % self.src_name)

    def prepare(self):
        '''删除已经存在的result文件'''
        self.rm_temp()

        if not os.path.exists(setting.TEMP_DIR):
            os.mkdir(setting.TEMP_DIR)

        if not os.path.exists(setting.RESULT_DIR):
            os.mkdir(setting.RESULT_DIR)
        if os.path.exists(self.result_file):
            os.remove(self.result_file)
        if os.path.exists(self.report_file):
            os.remove(self.report_file)

    def copy_subsource_resource(self):
        '''复制运行subsourcecrawler需要的文件'''

        print 'Copy subsourcecrawler template to temp directory'
        temp = os.path.join(setting.TEMP_DIR, self.src_name)
        self.subsource_dist = os.path.join(temp, 'subsource')

        shutil.copytree(setting.SUBSOURCE_SRC, self.subsource_dist)

        dist_crawler_conf = os.path.join(self.subsource_dist,  'conf/SubSourceCrawlerConfig.xml')
        src_crawler_conf = os.path.join(self.src_dir, 'SubSourceCrawlerConfig.xml')

        print 'Generate SubSourceCrawlerConfig.xml'
        #read the source
        doc = et.parse(src_crawler_conf)
        # you need to output the url as an unicode string
        doc.find('UrlTransformation').text = os.path.join(self.src_dir, "%s-url.xq" % self.src_name)
        doc.write(dist_crawler_conf, encoding='utf-8')

    def run_subsourcecrawler(self):
        '''运行subsourcecrawler'''

        print 'Start to run SubSourceCrawler.'
        os.chdir(self.subsource_dist)
        ret = subprocess.call(['java -jar subsourcecrawler-0.1.2-jar-with-dependencies-liang.jar'], shell=True)
        if ret != 0:
            exit()
        print 'SubSourceCrawler has done it\'s work'

    def read_finished_xml(self, provided=False):
        '''读取finished.xml中的subforum'''

        try:
            if provided:
                doc = et.parse(os.path.join(self.src_dir,  'finished.xml'))
            else:
                doc = et.parse(os.path.join(self.subsource_dist,  'finished.xml'))
                shutil.copy(os.path.join(self.subsource_dist,  'finished.xml'), self.src_dir)
            for urlNode in doc.findall(".//url"):
                self.urls.put(urlNode.text)
        except:
            send_gtalk("Running subsource crawler failed on [%s]" % self.src_name)
            exit(-1)

        url_count = self.urls.qsize()
        if url_count == 0:
            print 'Threre are no subforum in finished.xml, may be there are some wrong with the SubSourceCrawlerConfig.xml'
            send_gtalk("Threre are no subforum in finished.xml of [%s]" % self.src_name)
            exit(-1)
        else:
            print 'There are %d subforums in this source.' % url_count

    def run_ingentia(self):
        '''多线程运行ingentia'''
        for i in range(0,  self.max_thread):
            runner = SubforumRunner("thread-%d" % i, self.src_name, self.src_dir, self.urls)
            runner.daemon = True
            runner.start()
            print '%s started.' % runner.name

        self.urls.join()

    def rm_temp(self):
        '''删除测试所生成的临时文件'''
        if os.path.exists(src_dir):
            temp = os.path.join(setting.TEMP_DIR, self.src_name)
            if os.path.exists(temp):
                print 'Clearing all temp directories and result directories'
                shutil.rmtree(temp)


def check_config_file(basedir, name=''):
    if not name:
        if not os.path.exists(src_dir):
            print '''The directory you give me doesnot exist, please check it more carefully.'''
            exit()
    else:
        if not os.path.exists(os.path.join(src_dir, name)):
            print "Configuration file [%s] doesnot exists, please check it." % name
            exit()

def read_last_conf():
    if os.path.exists(os.path.join(setting.BINARY_SRC, 'lastconf.py')):
        try:
            import lastconf
            return (lastconf.src_path, lastconf.run_subsource, lastconf.thread_num)
        except:
            print 'There is something wrong with the last run configuration'

    return ('', 'N', 5)

def write_last_conf(src_path, run_subsource='N', thread_num=5):
    with codecs.open(os.path.join(setting.BINARY_SRC, 'lastconf.py'), 'w', 'utf-8') as lastconf:
        lastconf.write(u'﻿#!/usr/bin/python')
        lastconf.write(os.linesep)
        lastconf.write(u'# -*- coding: utf-8 -*-')
        lastconf.write(os.linesep)
        lastconf.write(u"src_path=u'%s'" % src_dir)
        lastconf.write(os.linesep)
        lastconf.write("run_subsource='%s'\n" % run_subsource)
        lastconf.write(os.linesep)
        lastconf.write("thread_num=%s\n" % thread_num)

def read_srcdir(last):
    '''从控制台读入src完整路径'''

    if len(sys.argv) < 2:
        src_dir = raw_input("Input your SOURCE_DIR:").decode(SYS_ENCODING)
        if src_dir == '':
            if last[0] != '':
                print "Nothing input, use %s " % last[0]
                src_dir = last[0]
            else:
                exit('Please input your source directory')
    else:
        src_dir = sys.argv[1]

    return src_dir

def read_runcrawler(last):
    '''#从控制台读入是否运行subsourcecrawler'''

    flag = raw_input("Do you want to run SubSourceCrawler? y/Y or n/N? (Default %s) : " % last[1])
    if flag == '':
        if last[1] != '':
            print "Nothing input, use %s " % last[1]
            flag = last[1]
        else:
            print "Nothing input, use N "
            flag = 'n'

    return flag

def read_threadnum(last):
    '''从控制台读入启动多少个测试进程'''
    thread_num = raw_input("How many threads do you want to start? (Default %s) : " % last[2])
    if thread_num == '':
        if last:
            print "Nothing input, use %s " % last[2]
            thread_num = last[2]
    else:
        thread_num = int(thread_num)

    return thread_num

def get_srcname(src_dir):
    '''读取src_dir的最后一部分作为src_name'''

    if src_dir.endswith(os.sep):
        src_dir = src_dir[0:-1]
    src_name = src_dir.rsplit(os.sep, 1)[1]

    return src_name

if __name__ == '__main__':
    #读入上次的配置
    last = read_last_conf()

    #输入本次的配置
    src_dir = read_srcdir(last)
    flag = read_runcrawler(last)
    thread_num = read_threadnum(last)
    src_name = get_srcname(src_dir)

    #保存本次的配置
    write_last_conf(src_dir, flag, thread_num)

    #检查文件完整性
    check_config_file(src_dir)
    check_config_file(src_dir, 'SubSourceCrawlerConfig.xml')
    check_config_file(src_dir, 'webForumConfiguration.xml')

    main = MainProcess(src_name, src_dir, thread_num)
    main.prepare()
    try:
        if flag == 'y' or flag == 'Y' or flag == 'yes' or flag == 'YES':
            main.copy_subsource_resource()
            main.run_subsourcecrawler()
            main.read_finished_xml()
        else:
            check_config_file(src_dir, 'finished.xml')
            main.read_finished_xml(True)
        main.run_ingentia()

        print 'Generating error report...'
        rpt = Reporter(src_name)
        rpt.gen()
    except OSError as e:
        print e
    except KeyboardInterrupt as e:
        print e
    finally:
        #main.rm_temp()
        send_gtalk("Testing [%s] finished " % src_name)


