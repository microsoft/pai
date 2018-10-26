import os
from deployment.k8sPaiLibrary.maintainlib import common


def touch_file(file_path):
    basedir = os.path.dirname(file_path)
    if basedir != "" and not os.path.exists(basedir):
        os.makedirs(basedir)
    with open(file_path, 'a'):
        os.utime(file_path, None)


def generate_k8s_config(api_servers_ip):
    file_path = "deployment/k8sPaiLibrary/template/config.template"
    template_data = common.read_template(file_path)
    dict_map = {
        "clusterconfig": {"api-servers-ip": api_servers_ip},
    }
    generated_data = common.generate_from_template_dict(template_data, dict_map)

    kube_config_path = os.path.expanduser("~/.kube")
    os.mkdir(kube_config_path)
    common.write_generated_file(generated_data, "{0}/config".format(kube_config_path))