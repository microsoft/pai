#!/usr/bin/env python

import shutil
import yaml
import os
import sys

try:
    from slugify import slugify
except:
    os.system("pip install python-slugify")
    from slugify import slugify


print("This script is used for migrating config from v0.10 to v0.11!")
print("Usage: pluginIdMigration.py from_directory to_directory")

input_dir = os.path.expanduser(sys.argv[1])
output_dir = os.path.expanduser(sys.argv[2])
print "Input directory:", input_dir
print "Output directory:", output_dir

# Migrate services-configuration.yaml
print("Migrating services-configuration.yaml...")
old_services_config_file = os.path.join(input_dir, "services-configuration.yaml")
services_config = yaml.load(open(old_services_config_file), yaml.SafeLoader)
if "webportal" in services_config and "plugins" in services_config["webportal"]:
    plugins = services_config["webportal"]["plugins"]
    for plugin in plugins:
        if "id" not in plugin:
            plugin["id"] = slugify(plugin["title"])
else:
    print "No webportal plugins to convert"


# write out the file
service_config_file = os.path.join(output_dir, "services-configuration.yaml")

with open(service_config_file, 'w') as outfile:
    yaml.dump(services_config, outfile, default_flow_style=False)


# copy layout.yaml, kubernetes-configuration.yaml, k8s-role-definition.yaml

shutil.copy2(os.path.join(input_dir, "layout.yaml"), output_dir)
shutil.copy2(os.path.join(input_dir, "kubernetes-configuration.yaml"), output_dir)
shutil.copy2(os.path.join(input_dir, "k8s-role-definition.yaml"), output_dir)
