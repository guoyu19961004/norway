__author__="sondre"
__date__ ="$Jan 22, 2010 3:49:32 PM$"


"""
This is the main class that all monkey eggs will be inherited from.
"""


def get_egg():
    """ Should return a instance of MonkeyEgg. """
    return MonkeyEgg();


class MonkeyEgg(object):
    def __init__(self):
        self.is_loaded_called_on_this_egg = False;

        # backpointer to the tmonkey
        self.__internal_tmonkey = None;

    def set_tmonkey_ref(self, tm ):
        """ Sets the internal tmonkey ref."""
        self.__internal_tmonkey = tm;
        
    def get_monkeyegg(self, type_of):
        """ Finds and returns a monkeyegg based on the type passed in.
        Will load the requested egg."""
        x = self.__internal_tmonkey.get_egg_by_type( type_of );

        if x == None:
            print "ERROR: The requested egg type:{0} could not be found.".format(str(type_of));
            raise RuntimeError( "Unable to find the requested egg type:" + str(type_of) );

        return x;

    def get_tmonkey_core(self):
        """ Returns a ref to the tmonkey object. """
        if not self.__internal_tmonkey:
            raise RuntimeError( "Cannot get_tmonkey_core from egg since its None.");
        
        return self.__internal_tmonkey;

    def load(self):
        """
        Here all the required external functionality will be loaded.
        This will always be called before the different commands
        specified in this egg is allowed to run.
        Return true on success and false on failure.
        """
        return( True );

    def unload(self):
        """
        Unload will remove all resources allocated by this egg.
        """
        pass;

    def depends_on(self):
        """ Returns a list with egg names that this egg require in order
            to work. tmonkey will then load these before loading this egg.
            Example: if you require the statusegg you would have            
            return( [statusegg.StatusEgg] )
            
            where statusegg.StatusEgg is a type, NOT a string."""
        return( [] );

    def get_commands(self):
        """
        Returns a list of the commands this egg provides.
        The list should contains tuples defined as:
            ( (cmd_name, cmd_alias1, cmd_alias2, ..., cmd_aliasN), function )
        or  ( (cmd_name, cmd_alias1, cmd_alias2, ..., cmd_aliasN), function, description )

        If the tuple do not contain the description element then the functions
        docstring is used as a description.
        """
        return []




