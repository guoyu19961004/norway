#/usr/bin/python
# -*- coding: utf-8 -*-
#Program:
#   生成svn的文件夹目录
#History:
#   2011-2-24   Liang   新建，编写了gen方法，读取team_members，生成文件夹结构
#   2011-3-30   Liang   添加删除已经存在的目录
#
#
#Todos:
#   直接调用pysvn extension对生成的文件夹结构自动import，然后删除临时文件夹

import os
import shutil

F = 'Forums'
B = 'Blogs'

dist = os.path.join(os.getcwd(), 'svn')

team_members = {  
    u'徐峥':(F,),
    u'林新杰':(B,),
    u'田泽华':(B,),
    u'张志炜':(B,),
    u'李怡':(B,),
    u'舒胜男':(F,),
    u'余一':(F,),
    u'车立昊':(B,),
    u'刘炳哲':(F,),
    u'容康':(F,),
    u'程玲':(B,),
    }

def rm_old():
    '''删除已经存在的'''
    if os.path.exists(dist):
        shutil.rmtree(dist)
        print '文件夹已经删除'

def gen():
    '''生成svn文件夹结构'''
    
    for member, source_types in team_members.iteritems():
        for source_type in source_types:
            path = os.path.join(dist, member, source_type)
            os.makedirs(path)

if __name__ == '__main__':
    rm_old()
    gen()
