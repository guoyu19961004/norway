#!/usr/bin/python
# -*- coding : utf-8 -*-

import os, sys
import os.path

import setting

class IngentiaError:
    def __init__(self):
        self.msg = ''
        self.detail = ''
        self.url = ''

    def __str__(self):
        return "%s \n %s \n %s\n" % (self.url, self.msg, self.detail)

class Reporter:

    def __init__(self, src_name):
        self.src_name = src_name
        self.result_log = os.path.join(setting.RESULT_DIR, "%s.log" % self.src_name)
        self.result_html = os.path.join(setting.RESULT_DIR, "%s-error.html" % self.src_name)

    def get_all_errors(self):
        errors = []

        with open(self.result_log) as file:
            flag = False
            error = None

            for line in file:
                if line.startswith('*** THIS IS AN ERROR WHICH IS SENT FROM THE INGENTIA CUSTOM NEWS CRAWLER***'):
                    flag = True
                    error = IngentiaError()
                if line.startswith('Time Zone (GMT/UTC)'):
                    flag = False
                    errors.append(error)
                if flag:
                    line = line.strip()
                    if line.startswith('Caused by: '):
                        msg = line[10:]
                        if error.detail == '':
                            error.detail = msg
                        else:
                            error.msg = msg
                    if line.startswith('The url that failed:'):
                        error.url = line[len('The url that failed:'):]
        return errors

    def gen(self):
        errs = self.get_all_errors()
        if 0 == len(errs):
            print "No error found in source [%s]" % self.src_name
            exit(0)

        errors = {}
        for err in errs:
            if err.msg in errors:
                errors[err.msg].append(err.url)
            else:
                errors[err.msg] = [err.url, ]

        if os.path.exists(self.result_html):
            os.remove(self.result_html)

        report_file = open(self.result_html, 'w')
        report_file.write('''<html><head></head><body>''')
        for key,value in errors.iteritems():
            if key == '':
                key = 'Http request errors'
            report_file.write("<h3>%s</h3>" % key)
            report_file.write("<ul>")
            for url in set(value):
                report_file.write("<li><a href='%s' target='_blank'>%s</a></li>" % (url, url))

            report_file.write("</ul>")

        report_file.write('''</body></html>''')
        report_file.close()

if __name__ == '__main__':
    src_name = raw_input("Please input source name: ")
    rpt = Reporter(src_name)
    rpt.gen()

