import os
from jinja2 import Template

templateString = open('nginx.conf.template', 'r').read()
renderedString = Template(templateString).render({
    "REST_SERVER_URI": os.environ['REST_SERVER_URI'],
    "PROMETHEUS_URI": os.environ['PROMETHEUS_URI'],
    "K8S_API_SERVER_URI": os.environ['K8S_API_SERVER_URI'],
    "WEBHDFS_URI": os.environ['WEBHDFS_URI']
})
open('nginx.conf', 'w').write(renderedString)

