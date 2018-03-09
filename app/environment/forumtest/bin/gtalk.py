#!/usr/bin/python
# -*- coding: utf-8 -*-

from pyxmpp.jid import JID
from pyxmpp.message import Message
from pyxmpp.jabber.client import JabberClient
from pyxmpp.jabber.simple import send_message
from pyxmpp import streamtls

class Gtalk():
    def __init__(self, sid, spwd):
        self.sid = JID(sid)
        self.spwd = spwd
    
    def send_msg(self, rid,  msg):
        self.rid = JID(rid)
        if not self.sid.resource:
            self.sid = JID(self.sid.node, self.sid.domain, 'send_message')

        msg = Message(to_jid=self.rid, body=msg)
        def send(stream):
            stream.send(msg)

        self.xmpp_do(send)

    def xmpp_do(self, function):
        class Client(JabberClient):
            def session_started(self):
                function(self.stream)
                self.disconnect()

        tls = streamtls.TLSSettings(require=True, verify_peer=False)
        auth = ['sasl:PLAIN']
        gtalkClient = Client(self.sid, self.spwd, tls_settings=tls, auth_methods=auth)
        gtalkClient.connect()
        try:
            gtalkClient.loop(1)
        except KeyboardInterrupt:
            print u'disconnecting...'
            gtalkClient.disconnect()
     

if __name__ == '__main__':
    g = Gtalk('zhlwish@gmail.com', u'150049')
    g.send_msg('flyingsnow1125@gmail.com', 'sweet heart')
