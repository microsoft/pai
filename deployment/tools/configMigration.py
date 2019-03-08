#!/usr/bin/env python

import shutil
import os
import yaml
import sys
from convert_to_layout import convert_to_layout
sys.path.extend("..")
from deployment.clusterObjectModel import forward_compatibility

print("This script is used for migrating config from v0.8 to v0.10!")
print("Usage: configMigration.py from_directory to_directory")

input_dir = os.path.expanduser(sys.argv[1])
output_dir = os.path.expanduser(sys.argv[2])
print "Input directory:", input_dir
print "Output directory:", output_dir

# generate layout.yaml
convert_to_layout(input_dir, output_dir)

# copy kubernetes-configuration.yaml, k8s-role-definition.yaml
shutil.copy2(os.path.join(input_dir, "kubernetes-configuration.yaml"), output_dir)
shutil.copy2(os.path.join(input_dir, "k8s-role-definition.yaml"), output_dir)

# convert service-configuration.yaml
old_service_configuration = yaml.load(open(os.path.join(input_dir, "services-configuration.yaml")))
service_configuration, updated = forward_compatibility.service_configuration_convert(old_service_configuration)
with open(os.path.join(output_dir, "services-configuration.yaml"), 'w') as outfile:
    yaml.dump(service_configuration, outfile, default_flow_style=False)
