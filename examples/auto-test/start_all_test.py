import os
import time
import json5
import argparse
from threading import Thread

from job_manage import JobManager


class Config(object):
    def __init__(self, rest_server_socket, hdfs_socket, webhdfs_socket, PAI_username, PAI_password):
        self.rest_server_socket = rest_server_socket
        self.hdfs_socket = hdfs_socket
        self.webhdfs_socket = webhdfs_socket
        self.PAI_username = PAI_username
        self.PAI_password = PAI_password


class Submitter(object):  # relate to the jobs
    def __init__(self, threshold, config):
        self.jobmanager = JobManager(config)
        self.threshold = threshold

    def runandlisten(self, config):
        ###
        # input_type: dict
        # input: the config of the job
        # output_type: None
        # output: None
        # start the job and call rest server API to monitor the state of the job
        ###
        try:
            self.jobmanager.start(config)
        except:
            print("Job " + config["jobName"] + " start failed!")
        else:
            old = time.time()
            try:
                state = self.jobmanager.get_status(job_name=config["jobName"])["state"]
                while (state == "RUNNING" or state == "WAITING") and time.time() - old < 60 * self.threshold:
                    time.sleep(20)
                    state = self.jobmanager.get_status(job_name=config["jobName"])["state"]
                if state == "FAILED":
                    print(config['jobName'] + " is failed!")
                else:
                    print(config['jobName'] + " is succeeded!")
                    self.jobmanager.stop(config["jobName"])
            except:
                print("Get state of job " + config["jobName"] + " failed!")

    def submit(self, filepath):
        ###
        # input_type: str
        # input: the absolute path
        # output_type: None
        # output: None
        # open the json file and use multi-thread to submit the job
        ###
        try:
            with open(filepath, 'r') as fp:
                config = json5.load(fp)
                config["jobName"] += ('_' + time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime(time.time())))
                thread = Thread(target=self.runandlisten, args=(config,))
                thread.start()
        except:
            print("The formulation of file " + filepath + " is wrong!")


class Scanner(object):  # relate to the files
    def __init__(self, threshold, config):
        self.submitter = Submitter(threshold, config)
        self.config = config

    def toAbsroot(self, path):
        ###
        # input_type: str
        # input: the relative path
        # output_type: str
        # output: the absolute path
        # change the relative path into absolute path
        ###
        return os.path.abspath(path)

    def scan(self, rootpath):
        ###
        # input_type: str
        # input: the relative path
        # output_type: None
        # output: None
        # scan all json file within 2 steps and submit jobs according to them
        ###
        rootpath = self.toAbsroot(rootpath)
        dirs_and_files = os.listdir(rootpath)
        # for parent, dirs, files in os.walk(rootpath):  # search all files and dirs under rootpath
        for item in dirs_and_files:
            if os.path.isdir(rootpath + '/' + item):
                files = os.listdir(rootpath + '/' + item)
                if "prepare.sh" in files:  # run the prepare shell script to download the data and code, then upload them to hdfs
                    os.system("/bin/bash " + rootpath + '/' + item + '/' + "prepare.sh " + self.config.hdfs_socket)
                for file in files:
                    if file.endswith(".json"):
                        filepath = rootpath + '/' + item + '/' + file
                        print(filepath)
                        self.submitter.submit(filepath)


parser = argparse.ArgumentParser()
parser.add_argument('--path', type=str, default='.')
parser.add_argument('--threshold', type=int, default=30)
parser.add_argument('--rest_server_socket', type=str, default="")
parser.add_argument('--hdfs_socket', type=str, default="")
parser.add_argument('--webhdfs_socket', type=str, default="")
parser.add_argument('--PAI_username', type=str, default="")
parser.add_argument('--PAI_password', type=str, default="")
args = parser.parse_args()
config = Config(rest_server_socket=args.rest_server_socket, hdfs_socket=args.hdfs_socket, webhdfs_socket=args.hdfs_socket, PAI_username=args.PAI_username, PAI_password=args.PAI_password)
scanner = Scanner(args.threshold, config)
scanner.scan(args.path)