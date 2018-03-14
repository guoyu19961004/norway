#!/usr/bin/python
# -*- coding : utf-8 -*-

import os
import os.path

# section you need to change

#BASE_DIR = os.path.dirname(os.getcwd())
BASE_DIR = "D:/biyesheji/norway-project/app/environment/forumtest"
THREAD_COUNT = 5

# The google talk notifier has not been implemented yet, so please just leave it alone
ENABLE_GTALK_MSG = False
MY_GMAIL_ID = 'sundayrong@gmail.com'

ENABLE_EMAIL_MSG = False
MY_EMAIL_ID = 'sundayrong@gmail.com'

#sections you do not need to change

SUBSOURCE_SRC = os.path.join(BASE_DIR, 'norway/subsource')
INGENTIA_SRC = os.path.join(BASE_DIR, 'norway/ingentia')
BINARY_SRC = os.path.join(BASE_DIR, 'bin')

TEMP_DIR = os.path.join(BASE_DIR, 'temp')
RESULT_DIR = os.path.join(BASE_DIR, 'result')

GMAIL_ID = 'diannorway@gmail.com'
GMAIL_PWD = 'mydiangroup'
GTALK_SERVER = 'talk.google.com'
GTALK_PORT = 5222

