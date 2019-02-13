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

from __future__ import print_function
import sys
import subprocess
import commands

py_ver_str = sys.version
def run(cmd):
        proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
        proc.wait()
        op = proc.stdout.read()
        code=proc.returncode
        if int(code) !=0:
            exception = 1
        else:
            # ensure type str return
            if py_ver_str[0] == '3':
                op = op.decode('utf-8')
            return op
        if exception == 1:
            str_code = str(code)
            return op

def just_run(cmd):
    return commands.getoutput(cmd)

def set_ntp_variables():
        # Currently only supports Ubuntu, and can be extended to support other operating systems in the future.
        ntp_package = 'ntp'
        ntp_service = 'ntp'
        ntp_query = "dpkg-query -s ntp"
        ntp_install_command = "apt-get install --force-yes -y ntp"
        ntp_status = "ntpdc -p"
        return (ntp_package,ntp_service,ntp_query,ntp_install_command)

def check_ntp_installation(ntp_query,ntp_install_command):
        print('Checking NTP installation status')
        if is_ntp_installed(ntp_query):
                print("NTP_INSTALLED")
        else:
                print("NTP not installed")
                install_ntp(ntp_install_command)

def install_ntp(ntp_install_command):
        run(ntp_install_command)
        print("NTP_INSTALLED")

def is_ntp_installed(ntp_query):
        ntp_query_out = just_run(ntp_query)
        if "is not installed" in ntp_query_out:
                return False
        else:
                return True

def add_ntp_servers():
        run("echo server 0.rhel.pool.ntp.org >> /etc/ntp.conf")
        run("echo server 1.rhel.pool.ntp.org >> /etc/ntp.conf")
        run("echo server 2.rhel.pool.ntp.org >> /etc/ntp.conf")
        run("echo server 3.rhel.pool.ntp.org >> /etc/ntp.conf")
        print("NTP_SERVERS_INSTALLED")

def restart_ntp_service(ntp_service):
        print(just_run("service "+ntp_service+" restart"))

def main():
        (ntp_package,ntp_service,ntp_query,ntp_install_command)=set_ntp_variables()
        check_ntp_installation(ntp_query,ntp_install_command)
        add_ntp_servers()
        restart_ntp_service(ntp_service)

main()