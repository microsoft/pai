import logging
import logging.config

import sys
import argparse
import http.client
import json
import base64


class EtcdUser:

    def __init__(self, user_name):
        self.user_name = user_name
        self.is_admin = 'false'
        self.pass_word = ''
        self.virtual_cluster = 'default'
        self.github_PAT = ''

class TransferClient:

    def __init__(self, etcd_uri, k8s_uri, admin_groupname):
        self.etcd_uri = etcd_uri
        self.k8s_uri = k8s_uri
        self.admin_group = admin_groupname
        self.etcd_conn = http.client.HTTPConnection(self.etcd_uri)
        self.k8s_conn = http.client.HTTPConnection(self.k8s_uri)
        self.flag_path = '/v2/keys/transferFlag'
        self.etcd_prefix = '/users/'
        self.secret_ns = "pai-user"
        self.secret_ns_user_v2 = "pai-user-v2"
        self.secret_ns_group_v2 = "pai-group"
        self.vc_set = set()

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

    def namespace_v1_data_prepare(self):
        user_list = []
        nsv1_result = http_get(self.k8s_conn, '/api/v1/namespaces/pai-user/secrets/', {'Accept': 'application/json'})
        if nsv1_result['code'] == 200:
            user_list = json.loads(nsv1_result['data'])['items']
        elif nsv1_result['code'] == 404:
            logger.info("No ledacy user data found in k8s namespace pai-user")
        else:
            logger.error("Check user data in k8s namespace pai-user")
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

    def secret_data_prepare_v2(self, user_info_item):
        meta_dict = dict()
        meta_dict['name'] = user_info_item['metadata']['name']
        grouplist = []
        virtual_cluster = []
        if base64.b64decode(user_info_item['data']['admin']).decode('utf-8')== 'true':
            grouplist.append(self.admin_group)
        if 'virtualCluster' not in user_info_item['data']:
            user_info_item['data']['virtualCluster'] = ''
        for vc_name in base64.b64decode(user_info_item['data']['virtualCluster']).decode('utf-8').split(','):
            if vc_name == '':
              continue
            self.vc_set.add(vc_name)
            grouplist.append(vc_name)
            virtual_cluster.append(vc_name)
        extension = {
          'virtualCluster': virtual_cluster
        }
        if 'githubPAT' in user_info_item['data'] and user_info_item['data']['githubPAT'] != '':
            extension['githubPAT'] = base64.b64decode(user_info_item['data']['githubPAT']).decode('utf-8')
        user_dict = {
            'username': user_info_item['data']['username'],
            'password': user_info_item['data']['password'],
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

    def prepare_secret_base_path(self):
        ns_res = http_get(self.k8s_conn, '/api/v1/namespaces/{0}'.format(self.secret_ns))
        if ns_res['code'] == 200:
            return
        elif ns_res['code'] == 404:
            payload = {"metadata":{"name":self.secret_ns}}
            res = http_post(self.k8s_conn, '/api/v1/namespaces', json.dumps(payload))
            if res['code'] == 201:
                logger.info("Create user info namespace successfully")
            else:
                logger.error("Create user info namespace failed")
                sys.exit(1)
        else:
            logger.error("Connect k8s cluster failed")
            sys.exit(1)

    def prepare_secret_base_path_v2(self):
        status = [0, 0]
        ns_res_user_v2 = http_get(self.k8s_conn, '/api/v1/namespaces/{0}'.format(self.secret_ns_user_v2))
        if ns_res_user_v2['code'] == 404:
            payload = {"metadata": {"name": self.secret_ns_user_v2}}
            res = http_post(self.k8s_conn, '/api/v1/namespaces', json.dumps(payload))
            if res['code'] == 201:
                logger.info("Create user info namespace (pai-user-v2) successfully")
                status[0] = 1
            else:
                logger.error("create user info namespace (pai-user-v2) failed")
                sys.exit(1)
        elif ns_res_user_v2['code'] != 200:
            logger.error("Connect k8s cluster failed when creating user ns v2")
            sys.exit(1)

        ns_res_group_v2 = http_get(self.k8s_conn, '/api/v1/namespaces/{0}'.format(self.secret_ns_group_v2))
        if ns_res_group_v2['code'] == 404:
            payload = {"metadata": {"name": self.secret_ns_group_v2}}
            res = http_post(self.k8s_conn, '/api/v1/namespaces', json.dumps(payload))
            if res['code'] == 201:
              logger.info("Create group info namespace (pai-group) successfully")
              status[1] = 1
            else:
              logger.error("create group info namespace (pai-group) failed")
              sys.exit(1)
        elif ns_res_group_v2['code'] != 200:
            logger.error("Connect k8s cluster failed when creating group ns")
            sys.exit(1)
        return status

    def create_secret_user(self, payload):
        check_res = http_get(self.k8s_conn, '/api/v1/namespaces/{0}/secrets/{1}'.format(self.secret_ns, payload['metadata']['name']))
        if check_res['code'] == 404:
            post_res = http_post(self.k8s_conn, '/api/v1/namespaces/{0}/secrets/'.format(self.secret_ns), json.dumps(payload))
            if post_res['code'] != 201:
                logger.error("Create user in k8s secret failed")
                sys.exit(1)

    def create_secret_user_v2(self, payload):
        check_res = http_get(self.k8s_conn, '/api/v1/namespaces/{0}/secrets/{1}'.format(self.secret_ns_user_v2, payload['metadata']['name']))
        if check_res['code'] == 404:
            post_res = http_post(self.k8s_conn, '/api/v1/namespaces/{0}/secrets/'.format(self.secret_ns_user_v2), json.dumps(payload))
            if post_res['code'] != 201:
                logger.error("Create user in k8s secret failed")
                sys.exit(1)

    def create_secret_group_v2(self, payload):
        check_res = http_get(self.k8s_conn, '/api/v1/namespaces/{0}/secrets/{1}'.format(self.secret_ns_group_v2,payload['metadata']['name']))
        if check_res['code'] == 404:
            post_res = http_post(self.k8s_conn, '/api/v1/namespaces/{0}/secrets/'.format(self.secret_ns_group_v2),
                             json.dumps(payload))
            if post_res['code'] != 201:
                logger.error("Create group in k8s secret failed")
                sys.exit(1)

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
        '-a', '--adminGroup',
        type=str,
        required=True)
    parser.add_argument(
        '-e', '--etcdUri',
        type=str,
        required=True)
    parser.add_argument(
        '-k', '--k8sUri',
        type=str,
        required=True)
    args = parser.parse_args()

    etcd_uri = args.etcdUri.split(',')[0].replace('http://','')
    admin_group_name = args.adminGroup

    logger.info('Starts to migrate legacy user data from etcd to kubernetes secrets')

    transferCli = TransferClient(etcd_uri, args.k8sUri.replace('http://',''), admin_group_name)

    if transferCli.check_transfer_flag() is False:
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

    res = transferCli.prepare_secret_base_path_v2()
    if res[0] == 1 and res[1] == 1:
      ns_pai_user_list = transferCli.namespace_v1_data_prepare()
      for user in ns_pai_user_list:
          secret_post_data = transferCli.secret_data_prepare_v2(user)
          transferCli.create_secret_user_v2(secret_post_data)
      vc_set = transferCli.vc_set
      for vc in vc_set:
          secret_post_data = transferCli.secret_data_prepare_v2_group(vc)
          transferCli.create_secret_group_v2(secret_post_data)
      logger.info('Legacy user data transfer from namespace v1 to namespace v2 successfully')
    else:
      logger.info("Legacy data has already been transferred from v1 to v2. Skip it.")

if __name__ == "__main__":
    main()

