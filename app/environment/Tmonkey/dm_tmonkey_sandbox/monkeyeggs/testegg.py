# -*- coding: utf-8 -*-

import tmonkeysettings as tm
import monkeyutility as mu
import monkeyegg
import updateegg
import sys
import os, os.path
import string
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

errors_locker = Lock()
transformed_locker = Lock()

class TestEgg( monkeyegg.MonkeyEgg ):

    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self);

    def get_commands(self):
        return [
                ( ("test"), self.test )
               ]

    def load(self):
        return True

    def unload(self):
        return True

    def get_source_type(self):
        if os.path.exists(os.path.join(self.sourcedir, '%s.xq' % self.sourcename)):
            return 'blog'
        else:
            return 'forum'

    def test_source(self, process, sourcedir, config_files):
        print 'Checking config file ...'
        file = mu.check_files_in_dir(config_files, sourcedir)
        if file:
            print "Configuration file [%s] does not exists." % file
            return

        process.prepare()
        try:
            process.run_ingentia()
        except OSError as e:
            print e
        except KeyboardInterrupt as e:
            print e

    def test(self, cmdline):
        """test source in tmonkey
            Usage:test [sourcename] ([maxThread] ([pageLimit]))
            maxThread and pageLimit for forum"""

        if tm.UPDATE_BEFORE_TEST:
            print "Updating directory of source ..."
            mu.update_dir(tm.SOURCE_DIR)

        args = mu.get_second_arg(cmdline).strip().split()
        if len(args) == 0:
            print "Invalid command, test [sourcename] ([maxThread] ([pageLimit]))"
            return
        elif len(args) == 1:
            self.sourcename, = args
            self.max_thread = '5'
            self.page_limit = '2'
        elif len(args) == 2:
            self.sourcename, self.max_thread = args
            self.page_limit = '2'
        elif len(args) == 3:
            self.sourcename, self.max_thread, self.page_limit = args

        print "Searching directory of %s ..." % self.sourcename
        self.sourcedir = mu.search_for_source(self.sourcename)
        if not self.sourcedir:
            print "Directory of %s doesn't exist.\n" % self.sourcename
            return

        self.sourcetype = self.get_source_type()
        if self.sourcetype == 'blog':
            process = BlogProcess(self.sourcename, self.sourcedir)
            config_files = ('%s.xq' % self.sourcename, 'config.xml', 'globalConfig.xml', 'subSourceConfig.xml')
        elif self.sourcetype == 'forum':
            process = ForumProcess(self.sourcename, self.sourcedir, string.atoi(self.max_thread), self.page_limit)
            config_files = ('%s-url.xq' % self.sourcename, '%s-thread.xq' % self.sourcename, 'finished.xml', 'webForumConfiguration.xml')
        self.test_source(process, self.sourcedir, config_files)

class SubforumRunner( Thread ):
    def __init__(self, name, sourcename, sourcedir, source_space, urls, page_limit):
        Thread.__init__(self, name = name)
        self.sourcename = sourcename
        self.sourcedir = sourcedir
        self.source_space = source_space
        self.urls = urls
        self.page_limit = page_limit
        self.errors_log = os.path.join(source_space, 'errors.log')
        self.transformed_log = os.path.join(source_space, 'transformed.log')
        self.temp_dir = os.path.join(source_space, 'temp')

    def prepare(self):
        pass

    def copy_ingentia_resource(self):
        #ingentia dist
        self.ingentia_dist = os.path.join(self.temp_dir, 'ingentia-%s' % self.id)
        shutil.copytree(tm.INGENTIA_PATH, self.ingentia_dist)

        #xq files
        src_thread_xq = os.path.join(self.sourcedir, "%s-thread.xq" % self.sourcename)
        dist_thread_xq = os.path.join(self.ingentia_dist, 'conf', 'transformation', '6.xq')
        shutil.copy(src_thread_xq, dist_thread_xq)

        src_url_xq = os.path.join(self.sourcedir, "%s-url.xq" % self.sourcename)
        dist_url_xq = os.path.join(self.ingentia_dist, 'conf', 'transformation', '5.xq')
        shutil.copy(src_url_xq, dist_url_xq)

        #config files
        src_forum_conf = os.path.join(self.sourcedir, 'webForumConfiguration.xml')
        dist_forum_conf = os.path.join(self.ingentia_dist, 'conf', 'configuration', 'webForumConfiguration.xml')
        shutil.copy(src_forum_conf, dist_forum_conf)

        dist_subsource_conf = os.path.join(self.ingentia_dist, 'conf', 'configuration', 'subSourceConfig.xml')

        subsource = """<?xml version='1.0' encoding='UTF-8'?>
<no.integrasco.immensus.storage.domain.source.SubSource>
  <subsourceid>1</subsourceid>
  <name>%s</name>
  <uri>%s</uri>
</no.integrasco.immensus.storage.domain.source.SubSource>"""
        subsource_file = codecs.open(dist_subsource_conf, 'w', 'utf8')
        subsource_file.write(subsource % (self.sourcename,  escape(self.url)))
        subsource_file.close()

    def run(self):
        while not self.urls.empty():
            self.url = self.urls.get()
            m = hashlib.md5()
            m.update(self.url)
            self.id = m.hexdigest()
            self.run_subforum()
            self.urls.task_done()

    def run_subforum(self):
        self.prepare()
        self.copy_ingentia_resource()
        print "%s running : %s" % (self.name, self.url)
        print "Start to run Ingentia."
        os.chdir(self.ingentia_dist)
        self.log_file = os.path.join(self.ingentia_dist, 'logs/%s.log' % self.sourcename)
        ret = subprocess.call(["java -jar %s -c legacythread >> %s" % (tm.INGENTIA_JAR, self.log_file)], shell=True)
        self.errors_file = os.path.join(self.ingentia_dist, 'logs/errors.log')
        self.transformed_file = os.path.join(self.ingentia_dist, 'logs/transformed.log')
        if os.path.exists(self.errors_file):
            with open(self.errors_file, 'r') as errors_file:
                for line in errors_file:
                    self.write_log(self.errors_log, line, errors_locker)
        if os.path.exists(self.transformed_file):
            with open(self.transformed_file, 'r') as transformed_file:
                for line in transformed_file:
                    self.write_log(self.transformed_log, line, transformed_locker)

    def write_log(self, log, msg, locker):
        locker.acquire()
        logfile = open(log, 'a')
        logfile.write("%s" % msg)
        logfile.close()
        locker.release()

class ForumProcess():
    def __init__(self, sourcename, sourcedir, max_thread, page_limit):
        self.sourcename = sourcename
        self.sourcedir = sourcedir
        self.max_thread = max_thread
        self.page_limit = page_limit
        self.source_space = os.path.join(tm.TMONKEY_DIR, 'sources', sourcename)
        self.urls = Queue()

    def prepare(self):
        self.clear_source_space()

    def read_finished_xml(self):
        doc = et.parse(os.path.join(self.sourcedir,  'finished.xml'))
        for urlNode in doc.findall(".//url"):
            self.urls.put(urlNode.text)

        url_count = self.urls.qsize()
        if url_count == 0:
            print 'Threre are no subforum in finished.xml, maybe there are some wrong with the SubSourceCrawlerConfig.xml'
        else:
            print 'There are %d subforums in this source.' % url_count

        return url_count

    def set_page_limit(self):
        webForumConfiguration_xml = os.path.join(self.sourcedir, 'webForumConfiguration.xml')
        webForumConfiguration_doc = et.parse(webForumConfiguration_xml)
        webForumConfiguration_doc.getroot().find('PageProcessingLimit').text = self.page_limit
        with codecs.open(webForumConfiguration_xml, 'w', 'utf-8') as web_file:
            web_file.write('<?xml version="1.0" encoding="UTF-8"?>\n')
            web_file.write(et.tostring(webForumConfiguration_doc.getroot()))

    def run_ingentia(self):
        count = self.read_finished_xml()
        if count < self.max_thread:
            max = count
        else:
            max = self.max_thread
        self.set_page_limit()
        for i in range(0,  max):
            runner = SubforumRunner('thread-%d' % i, self.sourcename, self.sourcedir, self.source_space, self.urls, self.page_limit)
            runner.daemon = True
            runner.start()
            print "%s started." % runner.name

        self.urls.join()

    def clear_source_space(self):
        if os.path.exists(self.source_space):
            shutil.rmtree(self.source_space)
        os.mkdir(self.source_space)

class BlogProcess():
    def __init__(self, sourcename, sourcedir):
        self.sourcename = sourcename
        self.sourcedir = sourcedir
        self.source_space = os.path.join(tm.TMONKEY_DIR, "sources", sourcename)
        self.temp_dir = os.path.join(self.source_space, 'temp')
        self.errors_log = os.path.join(self.source_space, 'errors.log')
        self.transformed_log = os.path.join(self.source_space, 'transformed.log')

    def prepare(self):
        self.clear_source_space()

    def copy_ingentia_resource(self):
        #ingentia dist
        self.ingentia_dist = os.path.join(self.temp_dir, 'ingentia')
        shutil.copytree(tm.INGENTIA_PATH, self.ingentia_dist)

        #xq files
        source_xq = os.path.join(self.sourcedir, '%s.xq' % self.sourcename)
        ingentia_source_xq = os.path.join(self.ingentia_dist, 'conf', 'transformation', 'TestTransformation.xq')
        shutil.copy(source_xq, ingentia_source_xq)

        #config files
        source_conf = os.path.join(self.sourcedir, 'config.xml')
        ingentia_conf = os.path.join(self.ingentia_dist, 'conf', 'configuration', 'config.xml')
        shutil.copy(source_conf, ingentia_conf)

        source_global_conf = os.path.join(self.sourcedir, 'globalConfig.xml')
        ingentia_global_conf = os.path.join(self.ingentia_dist, 'conf', 'configuration', 'globalConfig.xml')
        shutil.copy(source_global_conf, ingentia_global_conf)

        source_subsource_conf = os.path.join(self.sourcedir, 'subSourceConfig.xml')
        ingentia_subsource_conf = os.path.join(self.ingentia_dist, 'conf', 'configuration', 'subSourceConfig.xml')
        shutil.copy(source_subsource_conf, ingentia_subsource_conf)

    def run_ingentia(self):
        self.copy_ingentia_resource()
        print "running : %s" % self.sourcename
        print "Start to run Ingentia."
        os.chdir(self.ingentia_dist)
        ret = subprocess.call(["java -jar %s -c blogthread" % tm.INGENTIA_JAR], shell=True)
        self.errors_file = os.path.join(self.ingentia_dist, 'logs', 'errors.log')
        self.transformed_file = os.path.join(self.ingentia_dist, 'logs', 'transformed.log')  
        if os.path.exists(self.errors_file):
            shutil.copy(self.errors_file, self.errors_log)
        if os.path.exists(self.transformed_file):
            shutil.copy(self.transformed_file, self.transformed_log)     

    def clear_source_space(self):
        if os.path.exists(self.source_space):
            shutil.rmtree(self.source_space)
        os.mkdir(self.source_space)