# -*- coding: utf-8 -*-
import sys
import re
import os
import datetime
import subprocess
import tempfile
import urlparse

from lxml import etree
from Queue import Queue

import monkeyegg;
import tmonkeysettings as ts;
import monkeyutility as tu;

class SubsourceCrawlerEgg(monkeyegg.MonkeyEgg):
    '''crawl all subsource entries of a given forum
    '''
    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self)
        self.url_trans_file = tempfile.NamedTemporaryFile(bufsize=0)
        self.url_trans_path = self.url_trans_file.name
        self.visit_queue = Queue()
        self.visit_history = set([])
        self.subsources = {}
        self.url_trans_rs = {}
        self.failed_subsource = {}

    def get_commands(self):
        return [
                (('sc', 'subsourcecrawler'), self.run),
               ]

    def print_detail(self, msg):
        print 'INFO: %s %s' % (str(datetime.datetime.now())[:19], msg)
        if hasattr(self, 'log'):
            self.log.write('INFO: %s %s\n' % (str(datetime.datetime.now())[:19], msg))

    def run(self, cmdline):
        '''crawl subforums
Usage:
    sc [config path]
    '''

        self.url_trans_file = tempfile.NamedTemporaryFile(bufsize=0)
        self.url_trans_path = self.url_trans_file.name
        self.visit_queue = Queue()
        self.visit_history = set([])
        self.subsources = {}
        self.url_trans_rs = {}
        self.failed_subsource = {}

        source_flag = self.parse_cmdline(cmdline)
        config = self.get_config(source_flag)
        self.log = open(os.path.join(ts.SUBSOURCE_CRAWLER_ROOT_PATH, config['SourceName'] + '.log'), 'w', buffering=0)
        first_url = {config['FirstUrl']: config['SourceName']}
#        first_url = ['http://www.google.com', config['SourceName']]
        self.add_to_visit_queue(first_url)
        while(self.is_visit_queue_not_empty()):
            url = self.pop_url_from_visit_queue()
            link = url[0]
            name = url[1]
            visit_link = self.append_parameters_to_url(link, config['VisitAddon']) if config['FirstUrl'] != link else link
            self.print_detail('Visiting {0}'.format(visit_link))
#            link_dump = tempfile.NamedTemporaryFile(bufsize=0)
#            link_dump_path = link_dump.name
            link_dump_path = os.path.join(ts.TMONKEY_DIR, "libs", "subcrawlertempfile.donottouchme")
            link_dump = open(link_dump_path, "w")
            self.dump_page(visit_link, config['InputEncoding'], link_dump, config['UserAgent'])
            link_dump.close()
            raw_urls = self.get_all_urls_from_dump(link_dump_path)
            fixed_urls = self.fix_relative_urls(link, raw_urls)
            fixed_urls = self.remove_parameters_from_url(fixed_urls, config['RemoveParameter'])
            urls_to_be_visit = self.filter_urls(fixed_urls, self.convert_to_common_regular(config['UriPattern'] + config['SubsourceUriPattern']))
            self.add_to_visit_queue(urls_to_be_visit)
            if self.match_filter(link, self.convert_to_common_regular(config['SubsourceUriPattern'])):
                self.print_detail('Transforming {0}'.format(link))
                valid, msg = self.is_subsource_valid(config['UrlTransformation'], config['ThreadNode'], link_dump_path, link)
                if valid:
                    self.print_detail(msg)
                    self.subsources[link] = name
                else:
                    self.failed_subsource[link] = None
                    self.print_detail(msg)


        self.print_detail('Recrawl failed subsources')
        for i in range(2):
            for link in self.failed_subsource.keys():
                self.print_detail('Validating {0}'.format(visit_link))
                visit_link = self.append_parameters_to_url(link, config['VisitAddon'])
                link_dump_path = os.path.join(ts.TMONKEY_DIR, "libs", "subcrawlertempfile.donottouchme")
                link_dump = open(link_dump_path, "w")
                self.dump_page(visit_link, config['InputEncoding'], link_dump, config['UserAgent'])
                valid, msg = self.is_subsource_valid(config['UrlTransformation'], config['ThreadNode'], link_dump_path, link)
                if valid:
                    self.print_detail(msg)
                    self.subsources[link] = name
                    del self.failed_subsource[link]
                else:
                    self.print_detail(msg)


        result = self.build_forum_subsources(config['SourceName'], config['UrlAddon'])
        self.write_to_file(result, os.path.join(ts.SUBSOURCE_CRAWLER_ROOT_PATH, config['SourceName'] + '.xml'))

    def parse_cmdline(self, cmdline):
        args = tu.get_second_arg(cmdline)
        if cmdline == 'sc':
            return dict(flag='local',
                        config_file=ts.SUBSOURCE_CRAWLER_CONFIG_FILE_PATH)
        else:
            if os.path.exists(args):
                return dict(flag='local',
                            config_file=args)
            else:
                return dict(flag='db',
                            source=args)

    def get_config(self, source_flag):
        return self.parse_config(open(source_flag['config_file']).read())

    def parse_config(self, config_string):
        try:
            root = etree.XML(config_string)
            config = {}
            config['SourceName'] = root.find('.//SourceName').text
            config['FirstUrl'] = root.find('.//FirstUrl').text
            config['UriPattern'] = [node.text for node in root.findall('.//UriPattern')]
            config['SubsourceUriPattern'] = [node.text for node in root.findall('.//SubsourceUriPattern')]
            config['ThreadPattern'] = [node.text for node in root.findall('.//ThreadPattern')] if root.find('.//ThreadPattern') is not None else []
            config['InputEncoding'] = root.find('.//InputEncoding').text
            config['VisitAddon'] = root.find('.//VisitAddon').text if root.find('.//VisitAddon') is not None else ''
            config['UrlAddon'] = root.find('.//UrlAddon').text if root.find('.//UrlAddon') is not None else ''
            config['RemoveParameter'] = [node.text for node in root.findall('.//RemoveParameter')]
            config['UserAgent'] = root.find('.//UserAgent').text if root.find('.//UserAgent') is not None else ''
            config['ThreadNode'] = root.find('.//ThreadNode').text if root.find('.//ThreadNode') is not None else ''
            config['UrlTransformation'] = root.find('.//UrlTransformation').text if root.find('.//UrlTransformation') is not None else ''
        except:
            config = {}
            self.print_detail('Failed to parse config!')
            sys.exit(0)

        return config

    def get_url_transformation_from_db(self, source_name):
        d0_session = tu.get_source_on_d0_session()

        rs = d0_session.execute("""select c.configuration
                from source.mainsource as m, source.collectionconfig as cc, source.config as c
                where m.name = '{0}' and m.collectionid = cc.collectionid and
                cc.configid = c.configid""".format(source_name)).fetchone()
        if not rs:
            self.print_detail('Failed to get config from d0')
            sys.exit(0)
        url_trans_id = etree.XML(rs[0]).find('.//UrlTransformation').text

        rs = d0_session.execute("""SELECT transformationid, name, transformation
                FROM source.transformations t
                WHERE transformationid = {0}
                LIMIT 0,1""".format(url_trans_id)).fetchone()
        if not rs:
            self.print_detail('Url transformation not found')
            sys.exit(0)
        self.url_trans_file.write(rs[2])
        return self.url_trans_path


    def convert_to_common_regular(self , strings):
        '''convert special expression to common expressions 
        >>> instance.convert_to_common_regular(['http://www.google.com/${string}', 'http://www.google.com/${integer}/${string}'])
        ['http://www.google.com/[-A-Za-z_0-9.%]+$', 'http://www.google.com/[0-9]+/[-A-Za-z_0-9.%]+$']
        >>> instance.convert_to_common_regular(['http://www.google.com/${integ}'])
        ['http://www.google.com/${integ}$']'''

        converted_strings = [];
        pattern_maps = {r'${integer}':r'[0-9]+' , r'${string}':r'[-A-Za-z_0-9.%]+' , r'${all}':r'.*?'}
        for string in strings:
            string = string.strip().replace('?' , '\?')
            for raw , rs in pattern_maps.iteritems():
                string = string.replace(raw , rs)
            converted_strings.append(string + '$');
        return converted_strings

    def fix_relative_urls(self, baseurl, urls):
        '''generate the full path url links
        >>> instance.fix_relative_urls('http://www.google.com', {'./maps': 'map', 'image/search': 'image'})
        {'http://www.google.com/image/search': 'image', 'http://www.google.com/maps': 'map'}
        >>> instance.fix_relative_urls('http://www.ummah.com/forum/', {'forumdisplay.php?36-Troubleshooting-Section':'test'})
        {'http://www.ummah.com/forum/forumdisplay.php?36-Troubleshooting-Section': 'test'}'''
        fixed_urls = {}
        for url, name in urls.items():
            fixed_urls[urlparse.urljoin(baseurl, url)] = name
            del urls[url]
        return fixed_urls

    def add_to_visit_queue(self, urls):
        for link, name in urls.items():
            if link not in self.visit_history:
                self.visit_queue.put([link, name])
                self.visit_history.add(link)

    def is_visit_queue_not_empty(self):
        return not self.visit_queue.empty()

    def pop_url_from_visit_queue(self):
        url = self.visit_queue.get()
        return url

    def get_all_urls_from_dump(self, dump_path):
        file_string = open(dump_path).read()
        urls = {}
        try:
            root = etree.HTML(file_string)
            raw_urls = root.findall('.//a[@href]')

            for raw_url in raw_urls:
                title = unicode(raw_url.xpath('string()')).encode('utf-8')
                if title:
                    urls[unicode(raw_url.get('href')).encode('utf-8')] = title

            for url, name in urls.items():
                if not name:
                    urls[url] = 'N/A'
            return urls
        except:
            return urls

    def filter_urls(self, urls, expressions):
        filter_urls = {}
        for expression in expressions:
            for link, name in urls.items():
                if re.search(expression, link) and name:
                    filter_urls[link] = name
        return filter_urls

    def is_subsource_valid(self, url_trans_path, thread_node, link_dump, link):
        try:
            transform_rs = self.run_transformation(url_trans_path, link_dump, link, 0)

            if etree.XML(transform_rs).find('.//thread') is None:
                if etree.HTML(open(link_dump).read()).xpath(thread_node,
                                                            namespaces={'re':'http://exslt.org/regular-expressions'}):
                    return (False, 'No thread fetched, But found thread node! Needs manually check!!')
                return (False, 'No thread fetched!')

            threads = [node.text for node in etree.XML(transform_rs).findall('.//thread')]

            if len(threads) > 5:
                for fetched_link, fetched_threads in self.url_trans_rs.items():
                    for thread in threads[-2:]:
                        if thread in fetched_threads:
                            return (False, 'duplicate with {0}'.format(fetched_link))

            self.url_trans_rs[link] = threads[-3:] if len(threads) > 3 else threads

            return (True, 'Subosurce OK!')
        except:

            return (False, 'Transformation have errros')


    def run_transformation(self, xq_path_file, xml_root, document_uri, gmt):
        '''run transformation'''
        return subprocess.Popen('java -cp %s net.sf.saxon.Query -s:%s -q:%s documentUri="%s" gmtOffset="%s"' % (ts.SAXON9HE_JAR_PATH,
                                                                                                      xml_root,
                                                                                                      xq_path_file,
                                                                                                      document_uri,
                                                                                                      gmt), shell=True,
                               stdout=subprocess.PIPE).stdout.read()
#        return subprocess.Popen(["java",
#                                 "-cp",
#                                 ts.SAXON9HE_JAR_PATH,
#                                "net.sf.saxon.Query",
#                                "-s:%s" % (xml_root),
#                                "-q:%s" % (xq_path_file),
#                                "documentUri='%s'" % (document_uri),
#                                "gmtOffset='%s'" % (gmt)], shell=True,
#                               stdout=subprocess.PIPE).stdout.read()


    def dump_page(self, link, encoding, fp , user_agent=None):
        '''dump link to temp file, will perform clean it first
        >>> instance.dump_page('http://www.google.com')'''
        try:
            subprocess.call('java -jar {0} --encoding={1} "{2}"'.format(ts.CLEAN_TAGSOUP_JAR_PATH,
                                                                        encoding,
                                                                        link),
                                            shell=True,
                                            stderr=subprocess.PIPE,
                                            stdout=fp)
        except:
            self.print_detail('Failed to dump link: {0}'.format(link))

    def match_filter(self, link, expressions):
        for expression in expressions:
            if re.search(expression, link):
                return True
        return False

    def append_parameters_to_url(self , url , parameter):
        """set parameters to list of urls"""
        if parameter:
            parameter = re.sub('^&+', '', parameter)
            if re.search("\?" , url):
                url = url + '&' + parameter
            else:
                url = url + "?" + parameter
        return url

    def remove_parameters_from_url(self , urls , parameters):
        """remove specify parameters list from urls"""
        fixed_urls = {}
        for url, name in urls.items():
            for parameter in parameters:
                if url:
                    remove_value = re.findall("({0}=[^&]*&?)".format(parameter.replace('=', '')) , url)
                    if(len(remove_value)):
                        url = url.replace(remove_value[0] , "")
                        if(re.search(r"&$" , url)):
                            url = url.rstrip(r"&")
                    if re.search('\?$', url) : url = url[:-1]
            fixed_urls[url] = name
        return fixed_urls

    def build_forum_subsources(self, source_name, UrlAddon):
        return ('''<?xml version="1.0" encoding="UTF-8"?>
<sourceurls>\n''' + '\n'.join(map(lambda cell: '''    <sourceurl>
        <url>%s</url>
        <descriptions>
            <description>%s</description>
        </descriptions>
    </sourceurl>''' % (self.append_parameters_to_url(cell[0], UrlAddon).replace('&', '&amp;'), '{0}: {1}'.format(source_name, cell[1]).replace('&', '&amp;')), self.subsources.items())) + '''\n</sourceurls>''')


    def write_to_file(self, result, output):
        try:
            fp = open(output, 'w')
            fp.write(result)
            fp.close()
        except:
            self.print_detail('Failed to write to file')

if __name__ == '__main__':
    import doctest
    rs = doctest.testmod(extraglobs={'instance': SubsourceCrawlerEgg()})
    print rs.failed
