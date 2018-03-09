# -*- coding: utf-8 -*-

import tmonkeysettings as tm
import monkeyutility as mu
import monkeyegg
import os.path
import xml.etree.ElementTree
import codecs
import shutil

class VisualiseEgg( monkeyegg.MonkeyEgg ):

    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self);

    def get_commands(self):
        return [
                ( ("visualise"), self.visualise )
               ]

    def load(self):
        return True

    def unload(self):
        return True

    def visualise(self, cmdline):
        """Visualise transformed.log
            Usage:visualise [sourcename]"""

        sourcename = mu.get_second_arg(cmdline).strip()
        source_space = os.path.join(tm.TMONKEY_DIR, 'sources', sourcename)
        if mu.check_files_in_dir(('transformed.log', ), source_space):
            print "transformed.log does not exists."
            return
        transformed_log = os.path.join(source_space, 'transformed.log')
        transformed_xml = os.path.join(source_space, 'transformed.xml')
        print "Converting transformed.log to transformed.xml ..."
        mu.convert_log_to_xml(transformed_log, transformed_xml)
        transformed_doc = xml.etree.ElementTree.parse(transformed_xml)
        transformed_elm = transformed_doc.getroot().getchildren()
        sum = len(transformed_elm)
        if sum < tm.RANDOM_PAGE_AMOUNT:
            amount = sum
        else:
            amount = tm.RANDOM_PAGE_AMOUNT
        pages = mu.get_randoms(amount, sum)
        randomPage_xml_dir = os.path.join(source_space, 'randomPage.xml')
        if not os.path.exists(randomPage_xml_dir):
            os.mkdir(randomPage_xml_dir)
        for i in range(amount):
            print "creating randomPage-%d.xml ..." % i
            randomPage_xml  = os.path.join(randomPage_xml_dir, 'randomPage-%d.xml' % i)
            randomPage_html = os.path.join(source_space, 'randomPage-%d.html' % i)
            with codecs.open(randomPage_xml, 'w', 'utf-8') as randomPage_file:
                randomPage_file.write('<?xml version="1.0" encoding="UTF-8"?>\n')
                randomPage_file.write(xml.etree.ElementTree.tostring(transformed_elm[pages[i]]))
            mu.convert_xml_to_html('randomPage.xml/randomPage-%d.xml' % i, 'randomPage.xml/visualise.xsl', 'file:/%s' % tm.VISUALISE_CSS_PATH, randomPage_html)
        shutil.copy(tm.VISUALISE_XSL_PATH, os.path.join(randomPage_xml_dir, 'visualise.xsl'))
        os.remove(transformed_xml)