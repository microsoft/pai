from hdfs import Client
import urllib3
import json
import time


class JobManager(object):
    def __init__(self, config, expiration=30000):
        def get_token(username, password, expiration):
            ###
            # input_type: str, str, int
            # input: the username of PAI, the password of PAI and the expiration time of the token
            # output_type: str
            # output: token
            # Get the token from rest server API
            ###
            rest_server_url_without_namespace = '/'.join(self.rest_server_url.split('/')[:-3]) + '/'
            token_ready = False
            loop_count = 0
            while not token_ready:
                time.sleep(loop_count)
                loop_count += 1
                http_object = self.http.request(
                    'POST',
                    rest_server_url_without_namespace + 'token',
                    headers={
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body='username=' + username + '&password=' + password + '&expiration=' + str(expiration)
                )
                if http_object.status == 200:
                    token_ready = True
                    return json.loads(http_object.data.decode('utf-8'))['token']
                else:
                    print(http_object.status, http_object.data)

        self.rest_server_url = config.rest_server_url  # rest server url
        self.http = urllib3.PoolManager()  # urllib3 http
        self.token = get_token(config.PAI_username, config.PAI_password, expiration)  # rest Server token
        self.hdfs_client = Client(config.webhdfs_url)  # hdfs web url

    def get_status(self, job_name="", has_service=False, service='main'):
        ###
        # input_type: str
        # input: the name of the job
        # output_type: json
        # output: the information of the given job, its formation is following
        # return_json = {
        #     "state": str  # the state of the given job, include "SUCCEEDED"/"RUNNING"/"FAILED"
        #     "services": {}  # a list of dicts, key is the service name and the value is the url of that service
        #     "exit_type": str  # if the given job exits, there will be this item, include
        #                  "SUCCEEDED"/"TRANSIENT_NORMAL"/"TRANSIENT_CONFLICT"/"NON_TRANSIENT"/"UNKNOWN"
        #     "log": [str]  # the logs of the given job, every log is from its own container
        # }
        ###
        response = self.http.request(
            'GET',
            self.rest_server_url + 'jobs/' + job_name,
        )
        data = json.loads(response.data.decode('utf-8'))
        #return_json = {"state": data["jobStatus"]["state"].encode("utf-8")}
        return_json = {"state": data["jobStatus"]["state"]}
        if has_service:
            for key, value in data["taskRoles"].items():
                if value['taskStatuses'][0]['containerIp'] is None:
                    if 'services' in return_json:
                        del return_json['services']
                    break
                if 'services' not in return_json:
                    return_json['services'] = [{service: value['taskStatuses'][0]['containerIp'] + ':' + value['taskStatuses'][0]['containerPorts'][service]}]
                else:
                    return_json['services'].append({service: value['taskStatuses'][0]['containerIp'] + ':' + value['taskStatuses'][0]['containerPorts'][service]})
        if return_json["state"] == "FAILED":
            #return_json["exit_type"] = data["jobStatus"]["appExitType"].encode("utf-8")
            return_json["exit_type"] = data["jobStatus"]["appExitType"]
            if return_json["exit_type"] == "NON_TRANSIENT" or return_json["exit_type"] == "UNKNOWN":
                return_json["log"] = []
                for _, value in data["taskRoles"].items():
                    for task in value["taskStatuses"]:
                        #return_json["log"].append(task["containerLog"].encode("utf-8"))
                        return_json["log"].append(task["containerLog"])
        return return_json

    def start(self, job_json=None):
        ###
        # input_type: json
        # input: the json of the job
        # output_type: None
        # output: None
        # The json formation is consistent with the blank on WebPortal
        ###
        response = self.http.request(
            'POST',
            self.rest_server_url + 'jobs',
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + self.token,
            },
            body=json.dumps(job_json)  # json.dumps(self.job_json)
        )
        if response.status == 202:
            print(response.data)
            return True
        else:
            print(response.status, response.data)
            return False

    def stop(self, job_name):
        ###
        # input_type: str
        # input: the name of the job you want to stop
        # output_type: bool
        # output: the operation is correct
        ###
        response = self.http.request(
            'PUT',
            self.rest_server_url + 'jobs/' + job_name + '/executionType',
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + self.token,
            },
            body=json.dumps({'value': 'STOP'}),
        )
        if response.status == 202:
            print(response.data)
            return True
        else:
            print(response.status, response.data)
            return False
