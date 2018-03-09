import codecs
import sys
import os.path

from xml.dom.minidom import parse
from xml.dom import Node

def remove_whitespace_nodes(node):
	remove_list = []
	for child in node.childNodes:
		if child.nodeType==Node.TEXT_NODE and not child.data.strip():
			remove_list.append(child)
		elif child.hasChildNodes():
			remove_whitespace_nodes(child)
	
	for node in remove_list:
		node.parentNode.removeChild(node)
		node.unlink()

def run(path):
	doc = parse(path)
	remove_whitespace_nodes(doc)
	str = doc.toprettyxml()
    f = codecs.open(path, 'w', 'utf-8')
	f.write(str)
	f.close()
	print 'Process finished, please check it'

def validate_path(path):
	if not path.startswith('/'):
		path = os.path.join(os.getcwd(), path)
	
	if not os.path.exists(path):
		print 'File does not exists!'
		return None
		
	return path

if __name__ == '__main__':
	if len(sys.argv) < 2:
		print 'No input xml file specified.'
		sys.exit()
		
	path = sys.argv[1]
	if path == 'help':
		print '[Function] This program tidy the xml to pretty format and removes the null text node in elements.\n[Usage]: python tidyxml.py FilePath'
		sys.exit()
	path = validate_path(path)
	
	run(path)
