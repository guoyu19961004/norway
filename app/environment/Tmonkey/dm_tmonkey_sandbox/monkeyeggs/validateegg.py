# -*- coding: utf-8 -*-

import tmonkeysettings as tm
import monkeyutility as mu
import monkeyegg
import os
import os.path
import xml.etree.ElementTree
import codecs
import string
import re
import urlparse
import httplib
import shutil
import subprocess

def check_item(doc, field, item, file):
    file.write('<field>\n')
    file.write('<name>%s</name>\n' % field.text)
    for i in item:
        file.write('<item>\n')
        description_node  = i.find('description')
        stringLength_node = i.find('stringLength')
        keyword_node      = i.find('keyword')
        duplicate_node    = i.find('duplicate')
        connect_node      = i.find('connect')
        node_node         = i.find('node')
        if not description_node == None:
            print 'item : %s' % description_node.text
            file.write('<description>%s</description>\n' % description_node.text)
        if not stringLength_node == None:
            check_stringLength(doc, field, stringLength_node, file)
            file.write('</item>\n')
            continue
        if not keyword_node == None:
            check_keyword(doc, field, keyword_node, file)
            file.write('</item>\n')
            continue
        if not duplicate_node == None:
            check_duplicate(doc, field, duplicate_node, file)
            file.write('</item>\n')
            continue
        if not connect_node == None:
            check_connect(doc, field, connect_node, file)
            file.write('</item>\n')
            continue
        if not node_node == None:
            check_node(doc, field, node_node, file)
            file.write('</item>\n')
            continue
        file.write('</item>\n')
    file.write('</field>\n')
            
def check_stringLength(doc, field, stringLength, file):
    strLen = string.atoi(stringLength.text)
    for e in doc.findall('*'):
        field_node = e.find('.//%s' % field.text)
        link_node  = e.find('.//link')
        if len(field_node.text) > strLen:
            file.write('<instance>\n')
            file.write(xml.etree.ElementTree.tostring(field_node) + '\n')
            file.write(xml.etree.ElementTree.tostring(link_node) + '\n')
            file.write('</instance>\n')

def check_keyword(doc, field, keyword, file):
    for e in doc.findall('*'):
        field_node = e.find('.//%s' % field.text)
        link_node  = e.find('.//link')
        if re.search(keyword.text, field_node.text):
            file.write('<instance>\n')
            file.write(xml.etree.ElementTree.tostring(field_node) + '\n')
            file.write(xml.etree.ElementTree.tostring(link_node) + '\n')
            file.write('</instance>\n')

def check_duplicate(doc, field, duplicate, file):
    record = {}
    duplicate_text = '(.+)'
    if not (duplicate.text == None or duplicate.text == ''):
        duplicate_text = duplicate.text
    if not re.search(r'(?<!\\)\(.+(?<!\\)\)', duplicate_text):
        duplicate_text = '(' + duplicate_text + ')'
    duplicate_text = duplicate_text.replace('(', '(?P<duplicate>', 1)
    for e in doc.findall('*'):
        field_node = e.find('.//%s' % field.text)
        link_node  = e.find('.//link')
        res = re.search(duplicate_text, field_node.text)
        if not res == None:
            key = res.group('duplicate')
            if record.has_key(key):
                record[key].append(link_node)
            else:
                record[key] = [link_node]
    for key in record:
        if len(record[key]) > 1:
            file.write('<instance>\n')
            file.write('<%s>%s</%s>' % (field.text, key, field.text))
            for link in record[key]:
                file.write(xml.etree.ElementTree.tostring(link) + '\n')
            file.write('</instance>\n')

def check_connect(doc, field, connect, file):
    random_field = []
    con = string.atoi(connect.text)
    randoms = mu.get_randoms(con, len(doc.getroot().getchildren()))
    for i in randoms:
        random_field.append(doc.getroot().getchildren()[i])
    for r in random_field:
        field_node = r.find('.//%s' % field.text)
        link_node  = r.find('.//link')
        print 'connect %s' %field_node.text
        status = httpStatus(field_node.text)
        if not status == 200:
            file.write('<instance>\n')
            file.write('<httpStatus>%d</httpStatus>\n' % status)
            file.write(xml.etree.ElementTree.tostring(field_node) + '\n')
            file.write(xml.etree.ElementTree.tostring(link_node) + '\n')
            file.write('</instance>\n')

def httpStatus(url):
    host, path = urlparse.urlsplit(url)[1:3]
    where = url.find(host)
    p = url[(where+len(host)):]

    connection = httplib.HTTPConnection(host)
    connection.request("GET", p)
    responseOb = connection.getresponse()

    return responseOb.status

def check_node(doc, field, node, file):
    for e in doc.findall('*'):
        field_node = e.find('.//%s' % field.text)
        link_node  = e.find('.//link')
        if findNode(field_node, node):
            file.write('<instance>\n')
            file.write(xml.etree.ElementTree.tostring(field_node) + '\n')
            file.write(xml.etree.ElementTree.tostring(link_node) + '\n')
            file.write('</instance>\n')

def findNode(element, node):
    flag = True
    namespace = '{http://www.w3.org/1999/xhtml}'
    node_name = node.find('name')
    node_attr = node.find('attr')
    node_text = node.find('text')
    if flag and not node_name == None:
        if re.search(node_name.text, element.tag.replace(namespace, '')):
            flag = True
        else:
            flag = False
    if flag and not node_attr == None:
        if findAttr(element, node_attr):
            flag = True
        else:
            flag = False
    if flag and not node_text == None:
        if re.search(node_text.text, joinText(element)):
            flag = True
        else:
            flag = False
    if flag:
        return True
    for n in element.getchildren():
        if findNode(n, node):
            return True
    return False

def findAttr(element, attr):
    attr_name  = attr.find('name')
    attr_value = attr.find('value')
    for a in element.items():
        flag = True
        name, value = a
        if flag and not attr_name == None:
            if re.search(attr_name.text, name):
                flag = True
            else:
                flag = False
        if flag and not attr_name == None:
            if re.search(attr_value.text, value):
                flag = True
            else:
                flag = False
        if flag:
            return True
    return False

def joinText(element):
    text = ''
    if element.text:
        text = element.text
    for e in element.getchildren():
        text = text + joinText(e)
        if e.tail:
            text = text + e.tail
    return text

class ValidateEgg( monkeyegg.MonkeyEgg ):

    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self);

    def get_commands(self):
        return [
                ( ("validate"), self.validate )
               ]

    def load(self):
        return True

    def unload(self):
        return True

    def validate(self, cmdline):
        """Validate transformed.log and build report
            Usage:validate [sourcename]"""

        sourcename = mu.get_second_arg(cmdline).strip()
        source_space = os.path.join(tm.TMONKEY_DIR, 'sources', sourcename)
        if mu.check_files_in_dir(('transformed.log', ), source_space):
            print "transformed.log does not exists."
            return
        transformed_log  = os.path.join(source_space, 'transformed.log')
        transformed_xml  = os.path.join(source_space, 'transformed.xml')
        validate_xml_dir = os.path.join(source_space, 'validate.xml')
        validate_xml     = os.path.join(validate_xml_dir, 'validate.xml')
        validate_html    = os.path.join(source_space, 'validate.html')

        print "Converting transformed.log to transformed.xml ..."
        mu.convert_log_to_xml(transformed_log, transformed_xml)
        print "Validating transformed.xml ..."
        transformed_doc = xml.etree.ElementTree.parse(transformed_xml)
        validate_doc    = xml.etree.ElementTree.parse(tm.VALIDATE_XML_PATH)
        if not os.path.exists(validate_xml_dir):
            os.mkdir(validate_xml_dir)
        with codecs.open(validate_xml, 'w', 'UTF-8') as validate_file:
            validate_file.write('<?xml version="1.0" encoding="UTF-8"?>\n')
            validate_file.write('<report>')
            for c in validate_doc.findall('check'):
                print 'checking %s ...' % c.find('field').text 
                check_item(transformed_doc, c.find('field'), c.findall('item'), validate_file)
            validate_file.write('</report>')
        mu.convert_xml_to_html('validate.xml/validate.xml', 'validate.xml/validate.xsl', 'file:/%s' % tm.VALIDATE_CSS_PATH, validate_html)
        shutil.copy(tm.VALIDATE_XSL_PATH, os.path.join(source_space, 'validate.xml', 'validate.xsl'))
        os.remove(transformed_xml)
            