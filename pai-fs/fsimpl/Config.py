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

import pickle
from fsimpl import Errors

class Config:
    def __init__(self):

        try:
            file = open("pai-fs.config","rb")
            self.config = pickle.load(file)
            file.close()
        except IOError:
            self.config = {}
        except EOFError:
            self.config = {}


    def getHadoopConfig(self, user, host, port):
        if user:
            hdfsUser = user
        elif "user" in self.config.keys():
            hdfsUser = self.config["user"]
        else:
            hdfsUser = "root"

        if host:
            hdfsHost = host
        elif "host" in self.config.keys():
            hdfsHost = self.config["host"]
        else:
            hdfsHost = None

        if port:
            hdfsPort = port
        elif "port" in self.config.keys():
            hdfsPort = self.config["port"]
        else:
            hdfsPort = "50070"
        return hdfsUser, hdfsHost, hdfsPort

    def storeConfig(self, conf):

        try:
            file = open("pai-fs.config","rb")
            configs = pickle.load(file)
            file.close()
        except IOError:
            configs = {}
        except EOFError:
            configs = {}

        attrs = conf.split("=")
        if(len(attrs)==2 and attrs[1]!=""):
            configs[attrs[0]] = attrs[1]
            file = open("pai-fs.config","wb")
            pickle.dump(configs,file)
            file.close()
        else:
            raise Errors.FsException
