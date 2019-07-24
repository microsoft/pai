# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


"""
Paipdb is a simple wrapper of the pdb.

After Paipdb server starts, it will wait for client connect and all stdin/stdout will
redicret to the client side.
"""

import os
import sys
import pdb
import socket
import time
import traceback
import threading
import signal
from functools import partial

CURRENT_TASK_ROLE_NAME = os.environ.get("PAI_CURRENT_TASK_ROLE_NAME")
TASK_ROLE_INDEX = os.environ.get("PAI_TASK_ROLE_INDEX")
DEFAULT_ADDR = os.environ.get("PAI_HOST_IP_" + CURRENT_TASK_ROLE_NAME + "_" + TASK_ROLE_INDEX)
DEBUG_PORT_NAME = os.environ.get("DEBUG_PORT_NAME", "")
DEBUG_PORT_LIST = "PAI_PORT_LIST_" + CURRENT_TASK_ROLE_NAME + "_" + TASK_ROLE_INDEX + "_" + DEBUG_PORT_NAME

if os.environ.get(DEBUG_PORT_LIST) is None:
    print("Can not get debug port, exit")
    sys.exit(1)

DEFAULT_PORT = int(os.environ.get(DEBUG_PORT_LIST).split(',')[0])
# Debug will exit if there is no connection in 600 seconds
DEFAULT_TIMEOUT = int(os.environ.get("DEBUG_TIMEOUT", 600))

class FileObjectWrapper(object):
    def __init__(self, fileobject, stdio):
        self._obj = fileobject
        self._io = stdio

    def __getattr__(self, attr):
        if hasattr(self._obj, attr):
            attr = getattr(self._obj, attr)
        elif hasattr(self._io, attr):
            attr = getattr(self._io, attr)
        else:
            raise AttributeError("Attribute {} is not found".format(attr))
        return attr


class Paipdb(pdb.Pdb):

    def __init__(self, addr=DEFAULT_ADDR, port=DEFAULT_PORT, timeout=DEFAULT_TIMEOUT):
        """Initialize the socket here."""

        # Backup stdin and stdout before replacing them by the socket handle
        self.old_stdout = sys.stdout
        self.old_stdin = sys.stdin
        self.port = port
        self.addr = addr

        # Open a 'reusable' socket to let the webapp reload on the same port
        self.skt = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.skt.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, True)
        self.skt.settimeout(timeout)

        self.skt.bind((addr, port))
        self.skt.listen(1)
        
        # write to stderr for not buffering this message
        sys.stderr.write("paipdb is running on {}:{}\n".format(*self.skt.getsockname()))

        (clientsocket, _) = self.skt.accept()
        handle = clientsocket.makefile('rw')
        pdb.Pdb.__init__(self, completekey='tab',
                            stdin=FileObjectWrapper(handle, self.old_stdin),
                            stdout=FileObjectWrapper(handle, self.old_stdin))
        sys.stdout = sys.stdin = handle
        OCCUPIED.claim(port, sys.stdout)

    def stop_server(self):
        """Revert the stdin & stdout, close the socket"""

        sys.stdout = self.old_stdout
        sys.stdin = self.old_stdin
        OCCUPIED.unclaim(self.port)
        self.skt.close()


def set_trace(addr=DEFAULT_ADDR, port=DEFAULT_PORT, timeout=DEFAULT_TIMEOUT, frame=None):
    """
    wrapper function so we can user Paipdb.set_trace() as pdb usage
    """
    try:
        debugger = Paipdb(addr=addr, port=port, timeout=timeout)
    except socket.error:
        if OCCUPIED.is_claimed(port, sys.stdout):
            # paipdb is already on this port just ingnore and go on:
            print("(Recurrent paipdb invocation ignored)")
            return
        else:
            # Port occupied by something else.
            raise
    try:
        debugger.set_trace(frame or sys._getframe().f_back)
    except Exception:
        traceback.print_exc()


def _trap_handler(addr, port, timeout, signum, frame):
    set_trace(addr, port, timeout, frame=frame)


def handle_trap(addr=DEFAULT_ADDR, port=DEFAULT_PORT, timeout=DEFAULT_TIMEOUT):
    """Register rpdb as the SIGTRAP signal handler"""
    signal.signal(signal.SIGTRAP, partial(_trap_handler, addr, port, timeout))


def post_mortem(addr=DEFAULT_ADDR, port=DEFAULT_PORT, timeout=DEFAULT_TIMEOUT):
    debugger = Paipdb(addr=addr, port=port, timeout=timeout)
    tb = sys.exc_info()[2]
    traceback.print_exc()
    debugger.reset()
    debugger.interaction(None, tb)


# This class is refer to rpbd: https://github.com/tamentis/rpdb/blob/0.1.6/rpdb/__init__.py
class OccupiedPorts(object):
    """Maintain paipdb port versus stdin/out file handles.

    Provides the means to determine whether or not a collision binding to a
    particular port is with an already operating rpdb session.

    Determination is according to whether a file handle is equal to what is
    registered against the specified port.
    """

    def __init__(self):
        self.lock = threading.RLock()
        self.claims = {}

    def claim(self, port, handle):
        with self.lock:
            self.claims[port] = id(handle)

    def is_claimed(self, port, handle):
        with self.lock:
            got = (self.claims.get(port) == id(handle))
        return got

    def unclaim(self, port):
        with self.lock:
            del self.claims[port]

# {port: sys.stdout} pairs to track recursive rpdb invocation on same port.
# This scheme doesn't interfere with recursive invocations on separate ports -
# useful, eg, for concurrently debugging separate threads.
OCCUPIED = OccupiedPorts()

def main():
    args = sys.argv[1:]
    mainpyfile = args[0]
    sys.argv[:] = args

    # Do not buffer this message, print to stderr
    sys.stderr.write("debug host ip is set to {}, port is set to {}, timeout is set to {}\n".format(
        DEFAULT_ADDR, DEFAULT_PORT, DEFAULT_TIMEOUT))

    try:
        currentPdb = Paipdb()
    except socket.timeout:
        print("No client connect to server in {} seconds, exit".format(DEFAULT_TIMEOUT))
        sys.exit(1)
    except:
        traceback.print_exc()
        print('Failed to start the remote debug')
        sys.exit(1)

    # PDB will deal with the client close connection and stop the debugging
    while True:
        try:
            currentPdb._runscript(mainpyfile)
            if currentPdb._user_requested_quit:
                break
            print("The program finished and will be restarted")
        except pdb.Restart:
            print("Restarting", mainpyfile, "with arguments:")
            print("\t" + " ".join(args))
        except SystemExit:
            # In most cases SystemExit does not warrant a post-mortem session.
            print("The program exited via sys.exit(). Exit status: ", sys.exc_info()[1])
        except SyntaxError:
            traceback.print_exc()
            sys.exit(1)
        except:
            traceback.print_exc()
            print("Uncaught exception. Entering post mortem debugging")
            print("Running 'cont' or 'step' will restart the program")
            t = sys.exc_info()[2]
            currentPdb.interaction(None, t)
            print("Post mortem debugger finished. The " + mainpyfile +
                  " will be restarted")
    currentPdb.stop_server()

if __name__ == '__main__':
    import paipdb
    paipdb.main()
