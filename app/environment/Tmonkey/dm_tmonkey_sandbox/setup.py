import os
import sys

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

requires = ['MySQL-python'
            ]

setup(name='dm_tmonkey_sandbox',
      version='0.0',
      description='''Tmoneky sandbox for Dian group''',
      long_description=README + '\n\n' +  CHANGES,
      classifiers=["Programming Language :: Python"
                   ],
      author='Dian Group',
      author_email='',
      url='',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires = requires,
      )
