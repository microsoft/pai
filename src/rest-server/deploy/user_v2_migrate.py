import logging
import logging.config

import sys
import argparse
import http.client
import json
import base64

from kubernetes import client, config
from kubernetes.client.rest import ApiException

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

class EtcdUser:

    def __init__(self, user_name):
        self.user_name = user_name
        self.is_admin = 'false'
        self.pass_word = ''
        self.virtual_cluster = 'default'
        self.github_PAT = ''

class TransferClient:

    def __init__(self, admin_groupname, in_cluster=False):
        self.admin_group = admin_groupname
        self.secret_ns = "pai-user"
        self.secret_ns_user_v2 = "pai-user-v2"
        self.secret_ns_group_v2 = "pai-group"
        self.vc_set = set()
        self.in_cluster = in_cluster

    def namespace_v1_data_prepare(self):
        return self.list_all_secrets_from_namespace('pai-user')

    def secret_data_prepare_v2(self, user_info_item):
        meta_dict = dict()
        meta_dict['name'] = user_info_item.metadata.name
        grouplist = []
        virtual_cluster = []
        if base64.b64decode(user_info_item.data['admin']).decode('utf-8')== 'true':
            grouplist.append(self.admin_group)
        if 'virtualCluster' not in user_info_item.data:
            user_info_item.data['virtualCluster'] = ''
        for vc_name in base64.b64decode(user_info_item.data['virtualCluster']).decode('utf-8').split(','):
            if vc_name == '':
              continue
            self.vc_set.add(vc_name)
            grouplist.append(vc_name)
            virtual_cluster.append(vc_name)
        extension = {
          'virtualCluster': virtual_cluster
        }
        if 'githubPAT' in user_info_item.data and user_info_item.data['githubPAT'] != '':
            extension['githubPAT'] = base64.b64decode(user_info_item.data['githubPAT']).decode('utf-8')
        user_dict = {
            'username': user_info_item.data['username'],
            'password': user_info_item.data['password'],
            'email': '',
            'grouplist': str(base64.b64encode(json.dumps(grouplist).encode('utf-8')), 'utf-8'),
            'extension': str(base64.b64encode(json.dumps(extension).encode('utf-8')), 'utf-8'),
        }
        post_data_dict = {}
        post_data_dict['metadata'] = meta_dict
        post_data_dict['data'] = user_dict

        return post_data_dict

    def secret_data_prepare_v2_group(self, groupname):
        meta_dict = dict()
        meta_dict['name'] = (''.join([hex(ord(c)).replace('0x', '') for c in groupname]))
        extension = {
          'groupType': 'vc'
        }
        group_dict = {
            'groupname': str(base64.b64encode(groupname.encode('utf-8')), 'utf-8'),
            'description': str(base64.b64encode('vc {0}\'s group'.format(groupname).encode('utf-8')), 'utf-8'),
            'externalName': str(base64.b64encode(''.encode('utf-8')), 'utf-8'),
            'extension': str(base64.b64encode(json.dumps(extension).encode('utf-8')), 'utf-8'),
        }
        post_data_dict = {}
        post_data_dict['metadata'] = meta_dict
        post_data_dict['data'] = group_dict
        return post_data_dict

    def load_v2_groups(self):
        ns_pai_group_list = self.list_all_secrets_from_namespace(self.secret_ns_group_v2)
        decode_group_list = []
        vc_set = set()
        for group in ns_pai_group_list:
            try:
                meta_dict = dict()
                meta_dict['name'] = bytes.fromhex(group.metadata.name).decode('utf-8')
                group_dict = {
                    'groupname': str(base64.b64decode(group.data['groupname'].encode('utf-8')), 'utf-8'),
                    'description': str(base64.b64decode(group.data['description'].encode('utf-8')), 'utf-8'),
                    'externalName': str(base64.b64decode(group.data['externalName'].encode('utf-8')), 'utf-8'),
                    'extension': json.loads(str(base64.b64decode(group.data['extension'].encode('utf-8')), 'utf-8')),
                }
                decode_group_list.append({
                    'metadata': meta_dict,
                    'data': group_dict,
                })
                if group_dict['extension'].get('groupType') == 'vc':
                    vc_set.add(group_dict['groupname'])
            except Exception as e:
                logger.debug("Filter the secret {0} in namespace {1} due to group schema.".format(group.metadata.name, self.secret_ns_group_v2))
        return decode_group_list, vc_set

    def convert_v2_group(self, data_dict, all_vcs):
        extension_dict = data_dict['data']['extension']
        if 'acls' in extension_dict:
            return data_dict, False

        extension_dict['acls'] = {
            'admin': False,
            'virtualClusters': [],
        }
        if 'groupType' in extension_dict:
            if extension_dict['groupType'] == 'admin':
                extension_dict['acls']['admin'] = True
                extension_dict['acls']['virtualClusters'].extend(all_vcs)
            elif extension_dict['groupType'] == 'vc':
                extension_dict['acls']['virtualClusters'].append(data_dict['data']['groupname'])

        return data_dict, True

    def update_v2_group(self, data_dict):
        post_data_dict = {
            'metadata': {
                'name': data_dict['metadata']['name'].encode('utf-8').hex()
            },
            'data': {
                'groupname': str(base64.b64encode(data_dict['data']['groupname'].encode('utf-8')), 'utf-8'),
                'description': str(base64.b64encode(data_dict['data']['description'].encode('utf-8')), 'utf-8'),
                'externalName': str(base64.b64encode(data_dict['data']['externalName'].encode('utf-8')), 'utf-8'),
                'extension': str(base64.b64encode(json.dumps(data_dict['data']['extension']).encode('utf-8')), 'utf-8'),
            }

        }
        self.replace_secret_in_namespace(post_data_dict, self.secret_ns_group_v2)

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

    def replace_secret_in_namespace(self, payload, namespace):
        if self.in_cluster:
            config.load_incluster_config()
        else:
            config.load_kube_config(config_file="~/.kube/config")
        try:
            api_instance = client.CoreV1Api()
            meta_data = client.V1ObjectMeta()
            meta_data.name = payload['metadata']['name']
            body = client.V1Secret(
              metadata=meta_data,
              data=payload['data']
            )
            # don't use patch, which can't handle empty string: https://github.com/kubernetes/kubernetes/issues/37216
            api_instance.replace_namespaced_secret(payload['metadata']['name'], namespace, body)
        except ApiException as e:
            logger.error("Exception when calling CoreV1Api->patch_namespaced_secret: %s\n" % e)
            sys.exit(1)

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

    def prepare_secret_base_path_v2(self):
        status = [0, 0]
        if self.create_group_if_not_exist(self.secret_ns_user_v2):
            status[0] = 1
        if self.create_group_if_not_exist(self.secret_ns_group_v2):
            status[1] = 1
        return status

    def create_secret_user_v2(self, payload):
        self.create_secret_in_namespace_if_not_exist(payload, self.secret_ns_user_v2)

    def create_secret_group_v2(self, payload):
        self.create_secret_in_namespace_if_not_exist(payload, self.secret_ns_group_v2)

def main():
    parser = argparse.ArgumentParser(description="pai build client")
    parser.add_argument(
        '-a', '--adminGroup',
        type=str,
        required=True)
    parser.add_argument(
        '-i', '--incluster',
        required=False,
        default=False,
        action='store_true')
    args = parser.parse_args()

    admin_group_name = args.adminGroup
    in_cluster = args.incluster

    transferCli = TransferClient(admin_group_name, in_cluster)

    res = transferCli.prepare_secret_base_path_v2()
    if res[0] == 1 and res[1] == 1:
        ns_pai_user_list = transferCli.namespace_v1_data_prepare()
        for user in ns_pai_user_list:
            try:
                secret_post_data = transferCli.secret_data_prepare_v2(user)
                transferCli.create_secret_user_v2(secret_post_data)
            except Exception as e:
                logger.debug("skip the secret {0} in  secret_data_prepare_v2 ".format(user))
        vc_set = transferCli.vc_set
        for vc in vc_set:
            secret_post_data = transferCli.secret_data_prepare_v2_group(vc)
            transferCli.create_secret_group_v2(secret_post_data)
        logger.info('Legacy user data transfer from namespace v1 to namespace v2 successfully')
    else:
        logger.info("Legacy data has already been transferred from v1 to v2. Skip it.")

    group_list, vc_set = transferCli.load_v2_groups()
    for group in group_list:
        data_dict, updated = transferCli.convert_v2_group(group, vc_set)
        if updated:
            transferCli.update_v2_group(data_dict)


if __name__ == "__main__":
    main()

