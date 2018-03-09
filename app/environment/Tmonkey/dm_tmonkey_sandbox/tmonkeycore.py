"""

dm_tmonkey_flow main import file.
Will allow the tmonkey to reload itself.

"""

__author__ = "sondre"
__date__ = "$Jan 22, 2010 2:24:02 PM$"



import os
import sys
import re
import sys




__version__ = "2.0.3"
tm_version = __version__



class Command(object):
    def __init__(self, func, desc, monkeyegg):
        self.func = func;
        self.desc = desc;
        self.monkeyegg = monkeyegg;


class TerminalMonkey(object):
    def __init__(self):
        self.eggs = [];
        self.unittests = [];
        self.loaded_eggs = [];
        self.commands = {};
        self.egg_dependencies = {};
        self.restart_on_exit = False;

        self.quit = False;

    def import_unit_tests(self):
        cwd = os.getcwd()
        tmonkey_dir = sys.path[0]
        unit_tests_path = os.path.join(tmonkey_dir, "tests")

        if not unit_tests_path in sys.path:
            sys.path.append(unit_tests_path);

        unit_test_files = [test_file[:-3] for test_file in os.listdir(unit_tests_path) if test_file.endswith(".py") ]
        test_modules = []
        for test_file in unit_test_files:
            try:
                mod_temp = __import__(test_file)
            except:
                if get_debug_flag():
                    raise;
                print "failed to import test file: '{0}' - ignoring".format(test_file);
                continue;

            test_modules.append(mod_temp);

        self.unittests = [];

        for module in test_modules:
            try:
                dir_list = dir(module)
                module_test_names = [];
                for cls in dir_list:
                    if cls.endswith("Test") and isinstance(module.__dict__[cls], object):
                        module_test_names.append(cls);

                for module_unittest_name in module_test_names:
                    try:
                        unit_test = module.__dict__[ module_unittest_name ]();
                        unit_test.set_tmonkey_ref(self);
                        self.unittests.append(unit_test);
                    except IOError:
                        if get_debug_flag():
                            raise;

                        print "IOError importing unit_test: {0} - skipping.".format(module_unittest_name);
                        continue;

                    except:
                        if get_debug_flag():
                            raise;

                        print "Error importing unit_test: {0} - skipping.".format(module_unittest_name);
                        continue;

            except AttributeError:
                pass;

    def import_monkeyeggs(self):
        """ Loads all the monkeyeggs in ./monkeyeggs.
        NOTE: Will only load the global space of each monkeyegg."""

        cwd = os.getcwd()
        tmonkey_dir = sys.path[0]
        egg_path = os.path.join(tmonkey_dir, "monkeyeggs")

        #print "egg path:", egg_path

        # note: we dont remove the path from sys.path (so modules can be cross loaded).
        if not egg_path in sys.path:
            sys.path.append(egg_path);


        lib_path = os.path.join(tmonkey_dir , "libs")
        if not lib_path in sys.path:
            sys.path.append(lib_path);

        egg_files = [egg[:-3] for egg in os.listdir(egg_path) if egg.endswith(".py") ]
        eggs_modules = []
        for mfile in egg_files:
            
            mod_temp = __import__(mfile)
            

            eggs_modules.append(mod_temp);


        self.eggs = [];
        for module in eggs_modules:
            try:
                dir_list = dir(module)
                module_egg_names = [];
                for cls in dir_list:
                    if cls.endswith("Egg") and isinstance(module.__dict__[cls], object):
                        module_egg_names.append(cls);

                for module_egg_name in module_egg_names:
                    try:
                        egg = module.__dict__[ module_egg_name ]();
                        egg.set_tmonkey_ref(self);
                        self.eggs.append(egg);
                    except IOError:
                        if get_debug_flag():
                            raise;

                        print "IOError importing egg: {0} - skipping.".format(module_egg_name);
                        continue;

                    except:
                        if get_debug_flag():
                            raise;

                        print "Error importing egg: {0} - skipping.".format(module_egg_name);
                        continue;

            except AttributeError:
                pass;


    def run_imported_unit_tests(self):
        for unit_test in self.unittests:
            unit_test.runTest()


    def load_egg(self, egg):
        """ Loads a specific egg.
        NOTE: Each egg does not store if its loaded or not."""

        if egg == None:
            return True;

        if egg in self.loaded_eggs:
            return True;

        if egg.is_loaded_called_on_this_egg:
            print "Inter egg dependency cycle found."
            print "Please check the dependencies on the eggs."
            print "Aborting."
            raise RuntimeError("Inter Egg Dependency cycle.");

        egg.is_loaded_called_on_this_egg = True;


        for egg_type in self.egg_dependencies[egg]:

            # get_egg_by_type will call self.load_egg()            
            dependency_egg = self.get_egg_by_type(egg_type);

            if not egg:
                print "Warning: {0} in egg dependency does not exist:".format(egg_type);
                continue;

            if not dependency_egg:
                return False;
        try:
            if not egg.load():
                # turn off - so we can try to load the egg again
                # without any errors.
                egg.is_loaded_called_on_this_egg = False;
                if get_debug_flag():
                    print "Failed to load() egg:{0}".format(str(type(egg)))
                return False;
        except:
            if get_debug_flag():
                raise;
            else:
                egg.is_loaded_called_on_this_egg = False;
                print "A error occurred in load() for egg:{0}".format(str(type(egg)))
                return False;



        self.loaded_eggs.append(egg);
        return True;

    def get_egg_by_type(self, type_of):
        """ Returns the egg that got the correct type.
        Will load it as well, returns None if it does not
        exists. """
        for egg in self.eggs:
            if isinstance(egg, type_of):
                if not self.load_egg(egg):
                    return None;

                return egg;



    def unload_all_eggs(self):
        """ Will unload all loaded eggs. """
        for egg in self.loaded_eggs:
            egg.unload();


    def build_command_list(self):
        """  Will ask each monkeyegg for the description and the available
        commands for that monkeyegg.
        """
        for egg in self.eggs:
            for cmd in egg.get_commands():
                self.add_command(cmd, egg);

    def find_egg_dependencies(self):
        """ Will find the commands that each egg require as a
            inter egg dependency."""

        self.egg_dependencies = {};
        for egg in self.eggs:
            d = egg.depends_on();
            if not isinstance(d, list):
                d = [];

            self.egg_dependencies[egg] = d;



    def add_command(self, cmd, egg):
        """ Adds a command to tmonkey.
        cmd should be a tuple as returned from MonkeyEgg::get_commands()
        egg should be the monkeyegg this commands is attached to."""
        if len(cmd) < 2:
            print "WARNING: Trying to add incomplete command:", cmd, egg
            return;

        aliases = cmd[0]
        func = cmd[1]
        desc = ""
        if len(cmd) > 2:
            desc = cmd[2];
        else:
            desc = cmd[1].__doc__;


        if isinstance(aliases, str):
            aliases = [str(cmd[0]).strip()]
        else:
            if len(aliases) < 1:
                print "Warning: A command is created without a alias.", str(func), " skipping.";
                return;

        if len(aliases[0]) < 1:
                print "Warning: A command is created without a alias.", str(func), " skipping.";
                return;



        if func == None:
            print "Warning: No impl found for:", aliases[0], " skipping.";
            return;


        c = Command(func, desc, egg);


        for alias in aliases:
            if self.commands.has_key(alias):
                print "WARNING: Alias already exists:", alias
            self.commands[alias] = c;


    def execute(self, cmdline):
        """ Execute a command line."""

        if len(cmdline) < 1:
            return;

        cmd = cmdline.split()[0];
        cmd_func = None;
        try:
            cmd_egg = self.commands[cmd].monkeyegg;
            cmd_func = self.commands[cmd].func;
        except KeyError:
            print "Was unable to find the command: '" + cmd + "'";
            return;

        if not self.load_egg(cmd_egg):
            print "Unable to load egg, skipping command."
            return;

        # run the command
    
        cmd_func(cmdline);
    


    def add_core_commands(self):
        """ Will add the core commands to tmonkey."""
        self.add_command((("quit", "exit", "q"), self.cmd_quit), None)
        self.add_command((("help", "man"), self.cmd_help), None)
        self.add_command((("info"), self.cmd_info), None)
        self.add_command((("settings", "setting"), self.cmd_settings), None)



    def get_command(self, command):
        """ Will return the Command object for a command."""
        try:
            cmd = self.commands[command];
            return cmd;
        except KeyError:
            print "Cannot find command '" + command + "'";
            return None;

    def get_aliases(self, cmd):
        """ Returns the aliases for the cmd"""
        c_obj = cmd;
        if not isinstance(cmd, Command):
            c_obj = self.get_command(cmd);
            if c_obj == None:
                raise KeyError("Cannot find cmd requested of get_aliases:'" + cmd + "'");

        aliases = [];
        for k, v in self.commands.iteritems():
            if v == c_obj:
                aliases.append(k);

        return aliases;


    def cmd_settings(self, cmdline):
        """Prints out a overview over all the tmonkey settings."""

        print "var\tvalue"
        import tmonkeysettings
        names = dir(tmonkeysettings);
        for name in names:
            if re.match("^[A-Z_]+$", name):
                try:
                    print name[:40], "\t:", tmonkeysettings.__dict__[name]
                except:
                    pass;




    def cmd_quit(self, cmdline=""):
        """a core tmonkey function: Will cause tmonkey to quit."""
        self.quit = True;

    def cmd_help(self, cmdline):
        """ A core tmonkey function: Will return the description
        off the first argument.
        
        For a complete listing of all commands use: 'info'

        Usage: help [command]
        """
        s = cmdline.split();
        arg = "help";
        if len(s) > 1:
            arg = s[1]

        cmd = self.get_command(arg);
        if cmd == None:
            return;

        print cmd.desc;
        print ""
        print "aliases:"
        print self.get_aliases(cmd);


    def cmd_info(self, cmdline):
        """ A core tmonkey function:
            Will display general info about tmonkey.
        """
        print "------"
        global tm_version
        print "tmonkey [flow edition] version:", tm_version
        print ""


        cwd = os.getcwd()
        tmonkey_dir = sys.path[0]
        egg_path = os.path.join(tmonkey_dir, "monkeyeggs")
        print "cwd:", cwd;
        print "tmonkey_path:", tmonkey_dir
        print "monkeyegg_path:", egg_path
        print "debug mode:", get_debug_flag();
        print ""

        print "all commands (grouped by aliases):"
        all_cmd = sorted(self.commands.iteritems(), key=lambda (k, v): (v, k))
        last_cmd = None;
        for v in all_cmd:
            if last_cmd != v[1]:
                print "----------------------";
            print v[0];
            last_cmd = v[1];
        print "----------------------";
        print ""


        print "loaded monkey eggs:"
        for egg in self.loaded_eggs:
            print egg

        print "----------------------";




def welcome():
    global tm_version
    print "==============================="
    print " tmonkey [flow edition][" + tm_version + "]";
    print " By programers for programers."
    if get_debug_flag():
        print " [Currently in debug mode]"
    print "==============================="


def get_debug_flag():
    """ The debug flag is turned on if we are outside the /usr folder
    on a posix system. If the debug flag is set to false, all egg exceptions
    will be ignored allowing the system to perform as usual."""
    if not os.name == "posix":
        return False;

    if os.getcwd().startswith("/usr"):
        return False;

    if sys.path[0].startswith("/usr"):
        return False;

    return True;

if __name__ == "__main__":

    if "tmonkeycore" in sys.modules:
        import tmonkeycore
        reload(tmonkeycore)
    else:
        import tmonkeycore

    # check if we are in d


    # if we are running a single command or interactive mode (verbose)
    verbose = True;
    if len(sys.argv) > 1:
        verbose = False;

    if verbose:
        welcome();

    # Try to import the settings    
    try:
        import tmonkeysettings
        if verbose:
            print "loaded settings."
    except:
        if get_debug_flag():
                raise;
        print " <<<"
        print " Failed to import the tmonkeysettings";
        print " This is a fatal error and tmonkey is unable to operate as expected."
        print " You therefore might have to reinstall tmonkey - see wiki"
        print " for more details on installing tmonkey from scratch.";
        print " Continue at your own risk."
        print " >>>"

    #svn_version = get_svn_version(tmonkeysettings.TMONKEY_DIR)
    tm = tmonkeycore.TerminalMonkey();
    tm.add_core_commands();

    tm.import_monkeyeggs();

    if tmonkeysettings.RUN_UNIT_TESTS:
        tm.import_unit_tests();
        tm.run_imported_unit_tests();

    tm.build_command_list();
    tm.find_egg_dependencies();


    while not tm.quit:
        cmdline = ""
        if verbose:
            cmdline = raw_input(">");
        else:
            cmdline = ' '.join(sys.argv[1:])
            tm.cmd_quit("quit");

        if verbose and len(tmonkeysettings.PRE_CMD_DELIM) > 0:
            print tmonkeysettings.PRE_CMD_DELIM;

        try:
            tm.execute(cmdline);
        except KeyboardInterrupt:
            tm.cmd_quit("quit");

        if verbose and len(tmonkeysettings.POST_CMD_DELIM) > 0:
            print tmonkeysettings.POST_CMD_DELIM;

    tm.unload_all_eggs();
    if tm.restart_on_exit:
        print "Reloading dm_tmonkey_flow";
        sys.exit(42);
    else:
        sys.exit(0);

