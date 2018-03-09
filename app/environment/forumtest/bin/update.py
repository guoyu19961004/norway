#!/usr/bin/python
# -*- coding: utf-8 -*-

import subprocess
import setting

ret = subprocess.call("svn update %s --username=CheRish --password=150049" % setting.BASE_DIR, shell=True)

if ret == 0:
    print 'Update Sucessfully!'