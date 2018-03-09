# -*- coding: utf-8 -*-

import tmonkeysettings as tm
import monkeyutility as mu
import monkeyegg
import re
import os
import shutil
import codecs
import subprocess

class TransformEgg( monkeyegg.MonkeyEgg ):

    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self);

    def get_commands(self):
        return [
                ( ("transform"), self.transform )
               ]

    def load(self):
        return True

    def unload(self):
        return True

    def get_sourcename_from_url(self, url):
        res = re.match(r'^https?://(www\.)?(?P<sourcename>[^/]+)', url)
        if res == None:
            return ''
        else:
            return res.group('sourcename')

    def transform(self, cmdline):
        """transform url and build output.xml
            Usage:transform [url] ([sourcename])"""

        args = mu.get_second_arg(cmdline).strip().split()
        if len(args) == 0:
            print "Invalid command, transform [url] ([sourcename])"
            return
        elif len(args) == 1:
            url, = args
            sourcename = self.get_sourcename_from_url(url)
        elif len(args) == 2:
            url, sourcename = args

        sourcedir = mu.search_for_source(sourcename)
        if sourcedir == None:
            print "Directory of %s doesn't exist." % sourcename
            return
        source_thread_xq                 = os.path.join(sourcedir, '%s-thread.xq' % sourcename)
        source_webForumConfiguration_xml = os.path.join(sourcedir, 'webForumConfiguration.xml')
        file = mu.check_files_in_dir(('%s-thread.xq' % sourcename, 'webForumConfiguration.xml'), sourcedir)
        if file:
            print "File [%s] does not exists." % file
            return
        ingentia_url_xq    = os.path.join(tm.INGENTIA_PATH, 'conf', 'transformation', '5.xq')
        ingentia_thread_xq = os.path.join(tm.INGENTIA_PATH, 'conf', 'transformation', '6.xq')
        ingentia_subSourceConfig_xml       = os.path.join(tm.INGENTIA_PATH, 'conf', 'configuration', 'subSourceConfig.xml')
        ingentia_webForumConfiguration_xml = os.path.join(tm.INGENTIA_PATH, 'conf', 'configuration', 'webForumConfiguration.xml')
        shutil.copy(source_thread_xq, ingentia_thread_xq)
        shutil.copy(source_webForumConfiguration_xml, ingentia_webForumConfiguration_xml)
        with codecs.open(ingentia_url_xq, 'w', 'utf-8') as url_file:
            url_file.write('xquery version "1.0";\n')
            url_file.write('<forum>\n')
            url_file.write('	<threads>\n')
            url_file.write('		<thread>%s</thread>\n' % url)
            url_file.write('	</threads>\n')
            url_file.write('	<pages/>\n')
            url_file.write('</forum>\n')
        with codecs.open(ingentia_subSourceConfig_xml, 'w', 'utf-8') as subSourceConfig_file:
            subSourceConfig_file.write('<?xml version="1.0" encoding="UTF-8"?>\n')
            subSourceConfig_file.write('<no.integrasco.immensus.storage.domain.source.SubSource>\n')
            subSourceConfig_file.write('	<subsourceid>1</subsourceid>\n')
            subSourceConfig_file.write('	<name>transform</name>\n')
            subSourceConfig_file.write('	<uri>http://www.google.com/</uri>\n')
            subSourceConfig_file.write('</no.integrasco.immensus.storage.domain.source.SubSource>\n')
        os.chdir(tm.INGENTIA_PATH)
        subprocess.call(["java -jar %s -c legacythread" % tm.INGENTIA_JAR], shell=True)