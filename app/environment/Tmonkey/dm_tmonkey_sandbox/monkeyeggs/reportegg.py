# -*- coding: utf-8 -*-

import tmonkeysettings as tm
import monkeyutility as mu
import monkeyegg
import os
import codecs

class IngentiaError:
    def __init__(self):
        self.msg = ''
        self.detail = ''
        self.url = ''

    def __str__(self):
        return "%s \n %s \n %s\n" % (self.url, self.msg, self.detail)

class ReportEgg( monkeyegg.MonkeyEgg ):

    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self);

    def get_commands(self):
        return [
                ( ("report"), self.report )
               ]

    def load(self):
        return True

    def unload(self):
        return True

    def get_all_errors(self, errors_log):
        errors = []

        with open(errors_log) as errors_file:
            flag = False
            error = None

            for line in errors_file:
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

    def report(self, cmdline):
        """report errors.log in source and create errors.html
            Usage:report [sourcename]"""

        sourcename = mu.get_second_arg(cmdline).strip()
        source_space = os.path.join(tm.TMONKEY_DIR, 'sources', sourcename)
        if mu.check_files_in_dir(('errors.log', ), source_space):
            print "transformed.log does not exists."
            return
        errors_log  = os.path.join(source_space, 'errors.log')
        errors_html = os.path.join(source_space, 'errors.html')

        errs = self.get_all_errors(errors_log)
        errors = {}
        for err in errs:
            if err.msg in errors:
                errors[err.msg].append(err.url)
            else:
                errors[err.msg] = [err.url, ]

        if os.path.exists(errors_html):
            os.remove(errors_html)

        print "creating errors.html..."
        with codecs.open(errors_html, 'w', 'utf-8') as errors_file:
            errors_file.write("<html><head></head><body>")
            for key, value in errors.iteritems():
                if key == '':
                    key = 'Http request errors'
                errors_file.write("<h3>%s</h3>" % key)
                errors_file.write("<ul>")
                for url in set(value):
                    errors_file.write("<li><a href='%s' target='_blank'>%s</a></li>" % (url, url))
                errors_file.write("</ul>")
            errors_file.write("</body></html>")
