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

import os
import sys
import pdb
import socket
import traceback

import rpdb

def main():
    args = sys.argv[1:]
    mainpyfile = args[0]
    sys.argv[:] = args

    hostIp = os.environ.get("DEBUG_HOST_IP", "127.0.0.1")
    debugPort = int(os.environ.get("DEBUG_PORT", "4444"))
    debugTimeout = int(os.environ.get("DEBUG_TIMEOUT", "600"))

    print("debug host ip is set to {}, port is set to {}, timeout is set to {}".format(
          hostIp, debugPort, debugTimeout))

    try:
        currentPdb = rpdb.Rpdb(addr=hostIp, port=debugPort, timeout=debugTimeout)
    except socket.timeout:
        print("No client connect to server in {} seconds, exit".format(debugTimeout))
        sys.exit(1)
    except:
        traceback.print_exc()
        print('Failed to start the remote debug')

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
            print("The program exited via sys.exit(). Exit status:", end=' ')
            print(sys.exc_info()[1])
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

if __name__ == '__main__':
    import paipdb
    paipdb.main()
