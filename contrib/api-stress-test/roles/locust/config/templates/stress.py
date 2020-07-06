import os
import requests
import socket
import yaml
import uuid
import jinja2
from locust import task, between, constant_pacing
from locust.contrib.fasthttp import FastHttpUser

SERVICE_HOST_ENV_NAME = "KUBERNETES_SERVICE_HOST"
SERVICE_PORT_ENV_NAME = "KUBERNETES_SERVICE_PORT"
SERVICE_TOKEN_FILENAME = "/var/run/secrets/kubernetes.io/serviceaccount/token"
SERVICE_CERT_FILENAME = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"


def _join_host_port(host, port):
    """Adapted golang's net.JoinHostPort"""
    template = "%s:%s"
    host_requires_bracketing = ':' in host or '%' in host
    if host_requires_bracketing:
        template = "[%s]:%s"
    return template % (host, port)


def read_template(template_path):
    with open(template_path, "r") as f:
        template_data = f.read()
    return template_data


def generate_from_template_dict(template_data, jobname, vc):
    generated_file = jinja2.Template(template_data).render(
        {
            'jobname': jobname,
            'vc': vc
        }
    )
    return generated_file


with open(SERVICE_TOKEN_FILENAME) as f:
    kube_token = f.read()

kube_cert = SERVICE_CERT_FILENAME
k8s_headers = {
    "Authorization": "Bearer {0}".format(kube_token)
}
kube_url = "https://{0}".format(_join_host_port(os.environ[SERVICE_HOST_ENV_NAME], os.environ[SERVICE_PORT_ENV_NAME]))
pai_token = os.environ["PAI_TOKEN"]
job_template = read_template("/mnt/locust/job.yml")


class K8SAgent(FastHttpUser):
    wait_time = constant_pacing(30)
    jobid = 0
    userid = None
    max_retries = {{ locust_http_max_retries }}
    connection_timeout = {{ locust_http_connection_timeout }}
    network_timeout = {{ locust_http_network_timeout }}

    def on_start(self):
        self.userid = str(uuid.uuid4())

{% if stress_test_openpai_submit_job_enable %}
    @task({{ test_api_list.openpai_submit_job.weight }})
    def submit_job(self):
        hostname = os.environ['MY_POD_NAME']
        jobname = "stresstest-{0}-{1}-{2}".format(hostname, self.userid, self.jobid)
        self.jobid = self.jobid + 1
        template_data = generate_from_template_dict(job_template, jobname, "{{ virtual_cluster }}")

        openpai_headers = {
            "Authorization": "Bearer {0}".format(pai_token),
            "Content-Type": "text/yaml"
        }

        self.client.post(
            "/rest-server/api/v2/jobs",
            headers=openpai_headers,
            data=template_data
        )
{% endif %}

{% if stress_test_openpai_list_job_all_enable %}
    @task({{ test_api_list.openpai_list_job_all.weight }})
    def list_job_all(self):
        openpai_headers = {
            "Authorization": "Bearer {0}".format(pai_token),
        }
        self.client.get(
            "/rest-server/api/v2/jobs",
            headers=openpai_headers
        )
{% endif %}

{% if stress_test_k8s_list_pod_enable %}
    @task({{ test_api_list.k8s_list_pod.weight }})
    def get_pod_list(self):
        self.client.get(kube_url + "/api/v1/pods", verify = kube_cert, headers = k8s_headers)
{% endif %}