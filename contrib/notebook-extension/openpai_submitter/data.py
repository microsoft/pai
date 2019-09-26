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


import json as openpai_ext_json
import threading as openpai_ext_threading

if 'openpai_ext_lock' not in vars():
    openpai_ext_buffer_lock = openpai_ext_threading.Lock()


class openpai_ext_Storage(object):
    '''
    This class will not be run in multiple threads,
    but it may be run in multiple processes.
    It uses file system to store information and sync with each processes.
    '''

    def use_output(func):

        def func_wrapper(*args, **kwargs):
            token = args[1]
            args = args[0:1] + args[2:]
            ret = func(*args, **kwargs)
            openpai_ext_buffer_lock.acquire()
            print("__openpai${}__".format(token) + openpai_ext_json.dumps(
                {
                    'code': 0,
                    'message': ret,
                }
            ), flush=True)
            openpai_ext_buffer_lock.release()

        return func_wrapper

    def __init__(self, max_length=100):
        import os
        from openpaisdk import __flags__
        self.os = os
        self.max_length = max_length
        self.dirname = os.path.join(os.path.expanduser('~'), __flags__.cache)
        self.lock_path = os.path.join(self.dirname, "data.lock")
        self.data_path = os.path.join(self.dirname, "data")
        if not(os.path.exists(self.data_path)):
            self.data = []
            self.write_to_file()
        else:
            self.read_file()

    def acquire_lock(self):
        if self.os.path.exists(self.lock_path):
            raise Exception(
                'Unexpected lock file: {}! Please refresh the page or remove it manually!'.format(self.lock_path))
        with open(self.lock_path, 'w'):
            pass

    def release_lock(self):
        if not(self.os.path.exists(self.lock_path)):
            raise Exception('Missing lock file: {}! Please refresh the page.'.format(self.lock_path))
        self.os.remove(self.lock_path)

    def write_to_file(self):
        self.acquire_lock()
        try:
            with open(self.data_path, 'w') as f:
                openpai_ext_json.dump(self.data, f)
        except Exception:
            pass
        finally:
            self.release_lock()

    def read_file(self):
        with open(self.data_path) as f:
            self.data = openpai_ext_json.load(f)

    @use_output
    def get(self):
        self.read_file()
        return self.data

    @use_output
    def add(self, record):
        self.read_file()
        if len(self.data) == self.max_length:
            self.data = self.data[1:]
        self.data.append(record)
        self.write_to_file()
        return record

    @use_output
    def clear(self):
        self.data = []
        self.write_to_file()
        return ""

    @use_output
    def save(self, data):
        self.data = data
        self.write_to_file()
        return ""


openpai_ext_storage = openpai_ext_Storage()
