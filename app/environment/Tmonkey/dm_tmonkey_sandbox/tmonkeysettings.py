
"""
This module contains all the settings used by tmonkey_dian.

"""
import os
import getpass
import sys


def get_variable_value(value, var):

    if type(var) == type(0):
        if var < 1:
            return value;
        return var;

    if len(var) == 0:
        return value;
    return var;

# initial variables
INGENTIA_PATH = INGENTIA_JAR = INGENTIA_BLOG_PARAM = INGENTIA_FORUM_PARAM = INGENTIA_CLEANER_PARAM = ''
CLEAN_DUMP_PATH = CLEAN_TAGSOUP_JAR_PATH = ECLIPSE_DOWNLOADED_PAGE_FILE = ''
SUBSOURCE_CRAWLER_ROOT_PATH = ''
TMONKEY_SVN_USERNAME = TMONKEY_SVN_PASSWORD = ''
UPDATE_BEFORE_TEST = True

SAXON9HE_JAR_PATH = VALIDATE_XQ_PATH = VALIDATE_XML_PATH = VALIDATE_CSS_PATH = VALIDATE_XSL_PATH = ''
OUTPUT_XML_PATH = ''
RANDOM_PAGE_AMOUNT = 0
VISUALISE_XQ_PATH = VISUALISE_JS_PATH = VISUALISE_CSS_PATH = VISUALISE_XSL_PATH = ''

#required to overwrite 
SOURCE_SVN_USERNAME = SOURCE_SVN_PASSWORD = SOURCE_DIR = ''

# get the username - dont touch this please.
USERNAME = getpass.getuser();

# The location of the tmonkey app
TMONKEY_DIR = sys.path[0];

# The location of the home directory, for windows users, changed this to your working direcotry
HOME_DIR = "C:\\";

# displayed between each command, set to "" for no delim
PRE_CMD_DELIM = "-----"
POST_CMD_DELIM = "-----"

# source list server

#DMSOURCE_RPC_ADDR = "p1.integrasco.com"
DMSOURCE_RPC_ADDR = "diangroup.3322.org"
DMSOURCE_RPC_PORT = 8091

TMONKEY_SVN_USERNAME = "diangroup"
TMONKEY_SVN_PASSWORD = "BJ82sJh"

UPDATE_BEFORE_TEST = False
RUN_UNIT_TESTS = False

######################################################################################
#
#        alternate options for seperate users 
#
######################################################################################

if USERNAME == 'archenemy':
    INGENTIA_PATH = os.path.join(HOME_DIR , "Utilities" , "IntegrascoIngentiaDmediton")
    INGENTIA_JAR = "ingentia-test-crawler-1.1-jar-with-dependencies.jar"

    SUBSOURCE_CRAWLER_ROOT_PATH = "/home/enemy/Workspaces/XqueryRoot/SubsourceCrawler"

elif USERNAME == 'dian':
    INGENTIA_PATH = "D:\ingentia-dmedition"
    SOURCE_SVN_USERNAME = get_variable_value("lguujg", SOURCE_SVN_USERNAME)
    SOURCE_SVN_PASSWORD = get_variable_value("123456", SOURCE_SVN_PASSWORD)
else:
	SUBSOURCE_CRAWLER_ROOT_PATH = "D:/Dian/Norway/forumtest/finish"
	SUBSOURCE_CRAWLER_CONFIG_FILE_PATH ="D:/Dian/Norway/forumtest/finish/SubSourceCrawlerConfig.xml"

######################################################################################
#
#        default options
#        - DO NOT EDIT
#            instead add your own user profile above.
#
######################################################################################

#ingentia path
INGENTIA_PATH = get_variable_value("D:\\norway\\software\\ingentia-dmedition\\ingentia-dmedition" , INGENTIA_PATH)
INGENTIA_JAR = get_variable_value("ingentia-test-crawler-1.1.1-jar-with-dependencies.jar", INGENTIA_JAR);
INGENTIA_BLOG_PARAM = get_variable_value(INGENTIA_BLOG_PARAM , "-c blogthread");
INGENTIA_FORUM_PARAM = get_variable_value(INGENTIA_FORUM_PARAM , "-c legacythread");
INGENTIA_CLEANER_PARAM = get_variable_value(INGENTIA_CLEANER_PARAM , "-c clean");

#config for clean egg
CLEAN_DUMP_PATH = get_variable_value(CLEAN_DUMP_PATH , os.path.join(INGENTIA_PATH , "logs" , "cleanedump.log"))
CLEAN_TAGSOUP_JAR_PATH = get_variable_value(CLEAN_TAGSOUP_JAR_PATH , os.path.join(TMONKEY_DIR , "libs" , "tagsoup-1.2.jar"))
ECLIPSE_DOWNLOADED_PAGE_FILE = get_variable_value(os.path.join(HOME_DIR , "xqueryroot" , "transformation" , "downloadthread.xml") , ECLIPSE_DOWNLOADED_PAGE_FILE)

#config for subsource crawler egg
SUBSOURCE_CRAWLER_ROOT_PATH = get_variable_value("C:\Users\Enemy.Peng\Desktop\Sandbox", SUBSOURCE_CRAWLER_ROOT_PATH)

#source svn config
SOURCE_DIR = get_variable_value("D:\\norway\\eclipse\\workspace\\Transformation\\norwayDM", SOURCE_DIR)
SOURCE_SVN_USERNAME = get_variable_value("########################", SOURCE_SVN_USERNAME)
SOURCE_SVN_PASSWORD = get_variable_value("########################", SOURCE_SVN_PASSWORD)

#config for validate egg
SAXON9HE_JAR_PATH = get_variable_value(SAXON9HE_JAR_PATH, os.path.join(TMONKEY_DIR, 'libs', 'saxon9he.jar'))
VALIDATE_XML_PATH = get_variable_value(VALIDATE_XML_PATH, os.path.join(TMONKEY_DIR, 'libs', 'validate.xml'))
VALIDATE_CSS_PATH = get_variable_value(VALIDATE_CSS_PATH, os.path.join(TMONKEY_DIR, 'libs', 'validate.css'))
VALIDATE_XSL_PATH = get_variable_value(VALIDATE_XSL_PATH, os.path.join(TMONKEY_DIR, 'libs', 'validate.xsl'))

#config for visualise egg
RANDOM_PAGE_AMOUNT = get_variable_value(RANDOM_PAGE_AMOUNT, 10)
VISUALISE_JS_PATH = get_variable_value(VISUALISE_JS_PATH, os.path.join(TMONKEY_DIR, 'libs', 'visualise.js'))
VISUALISE_CSS_PATH = get_variable_value(VISUALISE_CSS_PATH, os.path.join(TMONKEY_DIR, 'libs', 'visualise.css'))
VISUALISE_XSL_PATH = get_variable_value(VISUALISE_XSL_PATH, os.path.join(TMONKEY_DIR, 'libs', 'visualise.xsl'))
