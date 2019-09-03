import logging
import logging.config

import sys
import argparse
import http.client
import json
import base64

from kubernetes import client, config
from kubernetes.client.rest import ApiException

class EtcdUser:

    def __init__(self, user_name):
        self.user_name = user_name
        self.is_admin = 'false'
        self.pass_word = ''
        self.virtual_cluster = 'default'
        self.github_PAT = ''

class TransferClient:

    def __init__(self, etcd_uri, k8s_uri, in_cluster=False):
        self.etcd_uri = etcd_uri
        self.k8s_uri = k8s_uri
        self.etcd_conn = http.client.HTTPConnection(self.etcd_uri)
        self.flag_path = '/v2/keys/transferFlag'
        self.etcd_prefix = '/users/'
        self.secret_ns = "pai-user"
        self.in_cluster = in_cluster

    def etcd_data_parse(self):
        etcd_result = http_get(self.etcd_conn, "/v2/keys/users?recursive=true")
        user_list = list()
        if etcd_result['code'] == 200:
            user_data = json.loads(etcd_result['data'])
            for user in user_data['node']['nodes']:
                user_name = user['key'].replace(self.etcd_prefix,"")
                etcd_user = EtcdUser(user_name)
                for info in user['nodes']:
                    if info['key'] == user['key'] + '/passwd':
                        etcd_user.pass_word = info['value']
                    elif info['key'] == user['key'] + '/admin':
                        etcd_user.is_admin = info['value']
                    elif info['key'] == user['key'] + '/virtualClusters':
                        etcd_user.virtual_cluster = info['value']
                    elif info['key'] == user['key'] + '/githubPAT':
                        etcd_user.github_PAT = info['value']
                user_list.append(etcd_user)
        elif etcd_result['code'] == 404:
            logger.info("No legacy user data found in etcd")
        else:
            logger.error("Check user data in etcd failed")
            sys.exit(1)
        return user_list

    def secret_data_prepare(self, user_info):
        post_data_dict = dict()
        meta_dict = dict()
        user_dict = dict()
        hex_key =    (''.join([hex(ord(c)).replace('0x', '') for c in user_info.user_name]))
        meta_dict['name'] = hex_key

        encode_name = str(base64.b64encode(user_info.user_name.encode('utf-8')), 'utf-8')
        encode_password = str(base64.b64encode(user_info.pass_word.encode('utf-8')), 'utf-8')
        encode_admin = str(base64.b64encode(user_info.is_admin.encode('utf-8')), 'utf-8')
        encode_vc = str(base64.b64encode(user_info.virtual_cluster.encode('utf-8')), 'utf-8')

        user_dict['username']= encode_name
        user_dict['password']= encode_password
        user_dict['admin'] = encode_admin
        user_dict['virtualCluster'] = encode_vc

        if user_info.github_PAT:
            encode_github = str(base64.b64encode((''.join([hex(ord(c)).replace('0x', '') for c in user_info.github_PAT])).encode('utf-8')), 'utf-8')
            user_dict['githubPAT'] = encode_github

        post_data_dict['metadata'] = meta_dict
        post_data_dict['data'] = user_dict

        return post_data_dict

    def list_all_secrets_from_namespace(self, namespace):
        if self.in_cluster:
            config.load_incluster_config()
        else:
            config.load_kube_config(config_file="~/.kube/config")
        try:
            api_instance = client.CoreV1Api()
            api_response = api_instance.list_namespaced_secret(namespace)
            return api_response.items
        except ApiException as e:
            if e.status == 404:
                return []
            logger.error('Exception when calling CoreV1Api->list_namespaced_secret: %s\n' % e)
            sys.exit(1)

    def create_group_if_not_exist(self, name):
        if self.in_cluster:
            config.load_incluster_config()
        else:
            config.load_kube_config(config_file="~/.kube/config")
        try:
            api_instance = client.CoreV1Api()
            api_instance.read_namespace(name)
        except ApiException as e:
            if e.status == 404:
                api_instance = client.CoreV1Api()
                meta_data = client.V1ObjectMeta()
                meta_data.name = name
                body = client.V1Namespace(
                  metadata=meta_data
                )
                api_instance.create_namespace(body)
                return True
            logger.error("Failed to create namespace [{0}]".format(name))
            sys.exit(1)
        return False

    def create_secret_in_namespace_if_not_exist(self, payload, namespace):
        if self.in_cluster:
            config.load_incluster_config()
        else:
            config.load_kube_config(config_file="~/.kube/config")
        try:
            api_instance = client.CoreV1Api()
            api_instance.read_namespaced_secret(payload['metadata']['name'], namespace)
        except ApiException as e:
            if e.status == 404:
                try:
                    api_instance = client.CoreV1Api()
                    meta_data = client.V1ObjectMeta()
                    meta_data.name = payload['metadata']['name']
                    body = client.V1Secret(
                        metadata=meta_data,
                        data=payload['data']
                    )
                    api_instance.create_namespaced_secret(namespace, body)
                except ApiException as create_e:
                    logger.error("Exception when calling CoreV1Api->create_namespaced_secret: %s\n" % create_e)
                    sys.exit(1)
            else:
                logger.error("Exception when calling CoreV1Api->read_namespaced_secret: %s\n" % e)
                sys.exit(1)

    def prepare_secret_base_path(self):
        self.create_group_if_not_exist(self.secret_ns)

    def create_secret_user(self, payload):
        self.create_secret_in_namespace_if_not_exist(payload, self.secret_ns)

    def check_transfer_flag(self):
        check_res = http_get(self.etcd_conn, self.flag_path)
        if check_res['code'] == 200:
            return True
        elif check_res['code'] == 404:
            return False
        else:
            logger.error("Connect to etcd failed")
            sys.exit(1)

def setup_logger_config(logger):
    """
    Setup logging configuration.
    """
    if len(logger.handlers) == 0:
        logger.propagate = False
        logger.setLevel(logging.DEBUG)
        consoleHandler = logging.StreamHandler()
        consoleHandler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] - %(filename)s:%(lineno)s : %(message)s')
        consoleHandler.setFormatter(formatter)
        logger.addHandler(consoleHandler)

logger = logging.getLogger(__name__)
setup_logger_config(logger)

def http_get(conn, url, headers={}):
    response_dict = dict()
    conn.request("GET", url, headers=headers)
    res = conn.getresponse()
    data = res.read()
    response_dict['code'] = res.code
    response_dict['data'] = data.decode('utf-8')
    return response_dict


def http_post(conn, url, payload=None, headers={}):
    response_dict = dict()
    conn.request("POST", url, payload, headers)
    res = conn.getresponse()
    response_dict['code'] = res.code
    response_dict['data'] = res.read().decode('utf-8')
    return response_dict

def main():
    parser = argparse.ArgumentParser(description="pai build client")
    parser.add_argument(
        '-e', '--etcdUri',
        type=str,
        required=True)
    parser.add_argument(
        '-k', '--k8sUri',
        type=str,
        required=True)
    parser.add_argument(
        '-i', '--incluster',
        required=False,
        default=False,
        action='store_true')
    args = parser.parse_args()

    etcd_uri = args.etcdUri.split(',')[0].replace('http://','')
    in_cluster = args.incluster

    logger.info('Starts to migrate legacy user data from etcd to kubernetes secrets')

    transferCli = TransferClient(etcd_uri, args.k8sUri.replace('http://',''), in_cluster)

    if transferCli.check_transfer_flag() is False and in_cluster is False:
        etcd_user_list = transferCli.etcd_data_parse()
        if etcd_user_list:
            transferCli.prepare_secret_base_path()
            for user in etcd_user_list:
                secret_post_data = transferCli.secret_data_prepare(user)
                transferCli.create_secret_user(secret_post_data)
        else:
            logger.info("No legacy data found")
        http_post(transferCli.etcd_conn, transferCli.flag_path)
        logger.info('Legacy user data transfer from etcd to kubernetes secret (pai-user namespace) successfully')
    else:
        logger.info("Etcd data has already been transferred to k8s secret")


if __name__ == "__main__":
    main()

