#!/usr/bin/env python2

import os
import sys
import subprocess
import shlex


def run_tmonkey():
    # assume that the tmonkey module is in the same folder as this file
    cwd = os.getcwd();
    tmonkey_dir = sys.path[0]
    tmonkey_core = os.path.join( tmonkey_dir, "tmonkeycore.py" )
    
    call = ["python", tmonkey_core];
    call.extend( sys.argv[1:] );
    

    try:
        return subprocess.call( call );        
            
    except OSError:
        print "Unable to load tmonkey, please check your installation."
        sys.exit(1);
    
    # just to make sure
    return 0;    
         
        
if __name__ == "__main__":
    exit_code = 42;
    while exit_code == 42:
        exit_code = run_tmonkey();
        
    
    
        
    
        
    
    
    
    

