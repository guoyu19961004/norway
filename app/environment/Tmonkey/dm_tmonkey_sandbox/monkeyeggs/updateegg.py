# -*- coding: utf-8 -*-

import tmonkeysettings as tm
import monkeyutility as mu
import monkeyegg

class UpdateEgg( monkeyegg.MonkeyEgg ):

    def __init__(self):
        monkeyegg.MonkeyEgg.__init__(self);

    def get_commands(self):
        return [
                ( ("update"), self.update )
               ]

    def load(self):
        return True

    def unload(self):
        return True

    def update(self, cmdline):
        """Update tmonkey from repository
            Usage:update"""
        mu.update_dir( tm.TMONKEY_DIR , tm.TMONKEY_SVN_USERNAME , tm.TMONKEY_SVN_PASSWORD )
        #reload(tmonkeycore) error while running
