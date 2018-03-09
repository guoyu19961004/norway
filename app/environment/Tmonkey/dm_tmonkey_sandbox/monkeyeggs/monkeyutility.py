# -*- coding: utf-8 -*-

"""
This module contains some utility function
for making it easier to write monkey eggs.

NOTE: all function in this utility should be 'safe'.
In the sence that it will never fail on a import, only
when you use function from this module.
"""

__author__ = "sondre"
__date__ = "$Jan 22, 2010 5:56:35 PM$"


import sys
import tmonkeysettings
import warnings
from xml.dom import minidom
import subprocess
import os.path
import codecs
from random import randint

def dependency_import(name, get_at):
    """ Will import the module with the name @name,
        if it fails it will prompt the user to get
        the module from @get_at.
        returns: the module.
    """
    try:
        x = __import__(name);
        return x;
    except ImportError:
        print "Unable to load the required python module: '" + name + "'";
        print "You might be able to find the module at: "
        print get_at
    return None;

def dependency_mysql():
    """ You can get the MySQLdb module with this function since it
        is so often loaded.
    """
    try:

        # ignore the depricated warning in MySQLdb
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            x = __import__("MySQLdb");

        return x;
    except ImportError:
        print "Unable to load the required python module: 'MySQLdb'";
        print "Ubuntu: 'sudo apt-get install python-mysqldb'";
        print "All others, please visit: ";
        print "\thttp://sourceforge.net/projects/mysql-python/";
    return None;

def get_dmsource_db(mysql_module):
    """ Returns a db item that is connected to d0.
    The @mysql_module should be a MySqldb module. """
    db = mysql_module.connect(host=tmonkeysettings.DMSOURCE_DB_ADDR,
                              user=tmonkeysettings.DMSOURCE_DB_USER,
                              passwd=tmonkeysettings.DMSOURCE_DB_PASS,
                              port=tmonkeysettings.DMSOURCE_DB_PORT,
                              db="dm_source", charset="utf8",
                              use_unicode=True);
    return(db);

def get_second_arg(cmdline):
    """ Returns the second argument returns
        a empty string if not any are present. """
    s = cmdline.strip().split();
    if len(s) > 1:
        return cmdline.replace(s[0], "", 1).strip();
    else:
        return ""

def get_forum_input_encoding():
    """ Returns the forum input encoding found
        in webForumConfiguration"""
    webForumConf = minidom.parse(tmonkeysettings.FORUM_DUMP)

    encoding = webForumConf.getElementsByTagName("SpecificInputEncoding")[0].firstChild.nodeValue

    return encoding

def get_blog_input_encoding():
    """ Returns the forum input encoding found
        in webForumConfiguration"""
    webForumConf = minidom.parse(tmonkeysettings.GLOBALCONFIG_DUMP)
    conf_path = tmonkeysettings.GLOBALCONFIG_DUMP
    encoding = webForumConf.getElementsByTagName("globalInputEncoding")[0].firstChild.nodeValue

    return encoding

def dump_to_file(data, filepath):
    """Dumps the data to a file. """

    try:
        out = file(filepath, "w")
        out.write(data.encode("utf-8"))
        out.close()

    except IOError:
        print "ERROR: Was unable to write to the given file."
        print "Are you sure the configuration is correct?"
        print "'{0}'".format(filepath);
        return False;

    return True;

def get_variable_value(var, value):

    if(var == None):
        return value;
    return var;

def update_dir(dirpath, username='', password=''):
    return subprocess.call("svn update %s  --username=%s --password=%s" % (dirpath , username , password) , shell=True)

def search_for_source(sourcename, dirpath=tmonkeysettings.SOURCE_DIR):
    if os.path.basename(dirpath) == sourcename:
        return dirpath
    else:
        if os.path.isdir(dirpath):
            for dir in os.listdir(dirpath):
                res = search_for_source(sourcename, os.path.join(dirpath, dir))
                if res:
                    return res
    return None

def check_files_in_dir(files, dirpath):
    for file in files:
        if not os.path.exists(os.path.join(dirpath, file)):
            return file
    return None

def convert_log_to_xml(log_path, xml_path=''):
    if xml_path == '':
        xml_path = log_path.replace('.xml', '.html')
    with codecs.open(log_path, 'r', 'mbcs', 'replace') as log_file:
        xml_file = codecs.open(xml_path, 'w', 'UTF-8')
        xml_file.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
        xml_file.write("<no.integrasco.domain.xml>\n")

        for line in log_file:
            line = line.replace('&lt;', '<')
            line = line.replace('&gt;', '>')
            line = line.replace('&apos;', '\'')
            line = line.replace('&quot;', '"')
            xml_file.write(line)

        xml_file.write("\n</no.integrasco.domain.xml>")
        xml_file.close()

def convert_xml_to_html(xml_path, xsl_path, css_path='', html_path=''):
    if html_path == '':
        html_path = xml_path.replace('.xml', '.html')
    with codecs.open(html_path, 'w', 'UTF-8') as html_file:
        html = """<html>
  <head>
    <script type="text/javascript" src="file:/%s"></script>
    <link rel="stylesheet" type="text/css" href="%s">
  </head>
  <body id="visualise" onload="loadStyle('%s', '%s')" />
</html>"""
        html_file.write(html % (tmonkeysettings.VISUALISE_JS_PATH, css_path, xml_path, xsl_path))
        html_file.close()

def get_randoms(n, m):
    """Create n random integers out of m."""
    if n > m:
        n = m
    res = []
    for i in range(n):
        while True:
            int = randint(0, m - 1)
            if not int in res:
                res.append(int)
                break
    return res

class Table(object):
    def __init__(self, align=str.center):
        """ Create a Table for pretty printing.
        NOTE that its not a completely finished class, its more of a constant work
        in progress.. so expect some miss aligment when using it, thought it should
        work for most of the cases. 
        
        The align option can be set to align the text to the right, left or the center.
        use: str.rjust, str.ljust or str.center respectivily - str.center is the default. 
        You can change the alignment at any time by using alignment attribute.
        
        Set truncate to false to make the table instead extend the row
        instead of truncating the text.
        Truncating is turned off by default. """
        self._columns = [];
        self.alignment = align;
        self.truncate = False;
        self._width = 80; # just some default value
        self._first_write = True;

    def set_columns(self, *cols):
        """ cols should be a list of colums, where each element
        is the width of a single column. """
        if isinstance(cols, list):
            self._columns = cols;
        elif isinstance(cols, tuple):
            self._columns = [e for e in cols];
        else:
            self._columns = [];
            self._columns.append(cols);

        # + some, since we got some borders to take care off
        self._width = sum([int(c) for c in self._columns]);
        self._width += 1 + len(self._columns);

    def row(self, *data):
        """ Write out a single row of data. """

        local_data = [];
        if isinstance(data, list):
            local_data = data;
        elif isinstance(data, tuple):
            local_data = [e for e in data];
        else:
            local_data.append(cols);


        buffer = [str(e).strip() for e in local_data];
        while len(buffer) < len(self._columns):
            buffer.append("");

        done = False;

        if self._first_write:
            self.close();
        else:
            self.line();
        self._first_write = False;

        while not done:
            row = "|";

            #print "buffer:", buffer
            done = True;
            for i in range(0 , len(buffer)):
                col = "";
                e = buffer[i];
                column_width = self._columns[i];

                s0, s1 = self._truncate(e, column_width);
                if len(s0) > 0:
                    col = s0;
                if len(s1) > 0 and not self.truncate:
                    buffer[i] = s1;
                    done = False;
                else:
                    buffer[i] = ""

                row += self.alignment(col, column_width);
                row += "|";

            print row;


    def line(self):
        """ Prints a horizontal line. """
        print "|" + ("-" * (self._width - 2)) + "|";

    def close(self):
        """ Close the table at the bottom. """
        print "#" + ("-" * (self._width - 2)) + "#";


    def _truncate(self, line, max_width):
        words = line.split();
        s0 = "";
        s1 = "";
        for w in words:
            if (len(s0) + len(w)) < max_width:
                s0 += " " + w;
            else:
                s1 += " " + w;
        return (s0.strip(), s1.strip());


# Table example:    
"""     
t = Table();
t.set_columns( 15, 10, 10 );

t.truncate = False;
t.row( "money.com ffs this dont work", "25", "53" );
t.row( "gimmethat.com", "2545", "053" );
t.row( "enokhaters.com", "25424425", "053" );
t.close();

s = "money.com ffs this dont work";
print "trunc test:"
s1, s2 = t._truncate(s, 15);
print "s1:", s1;
print "s2:", s2;
"""


class OutputProxy(object):
    def __init__(self, use_buffering=True):
        self.__use_buffer = use_buffering;
        self.__buff = "";
        self.redirect = False;

        # redirect
        self.__old = sys.stdout;
        sys.stdout = self;



    def off(self):
        if self.__old:
            sys.stdout = self.__old;
            if self.__use_buffer:
                return self.__buff;
            else:
                return None;
        else:
            return "";

    def write(self, text):
        if self.redirect:
            self.__old.write(text);

        if self.__use_buffer:
            self.__buff += text;

    def writelines(self, sequence_of_strings):
        if self.redirect:
            self.__old.writelines(sequence_of_strings);

        if self.__use_buffer:
            for s in sequence_of_strings:
                self.__buff += s;


"""
Example:
            
p = OutputProxy();
# p = OutputProxy(False);    # False for turning off buffering
p.redirect = True;           # will perform regular output as well.
print "hello world";
buffer = p.off();            # if buffering is turned off then this will return None
print "from buffer:", buffer;

"""

#dump raw page
def dump_link(link, user_agent=''):
    try:
        opener = urllib2.build_opener()
        if user_agent:
            opener.addheaders = [('User-agent', user_agent)]
        else:
            opener.addheaders = [('User-agent', 'Opera/9.64 (X11; Linux i686; U; en) Presto/2.1.1')]

        response = opener.open(link)
        raw_html = response.read()
        return raw_html
    except:
        return False


