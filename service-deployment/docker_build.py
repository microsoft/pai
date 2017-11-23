#!/usr/bin/env python

# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import subprocess
import sys
import os
import argparse
import yaml
import jinja2



def execute_shell(shell_cmd, error_msg):

    try:
        subprocess.check_call( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        print error_msg
        sys.exit(1)



def load_yaml_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f)

    return cluster_data



def read_template(template_path):

    with open(template_path, "r") as f:
        template_data = f.read()

    return template_data



def generate_from_template(template_data, cluster_config):

    generated_file = jinja2.Template(template_data).render(
        {
            "clusterconfig": cluster_config,
        }
    )

    return generated_file



def write_generated_file(file_path, content_data):

    with open(file_path, "w+") as fout:
        fout.write(content_data)



def login_docker_registry(docker_registry, docker_username, docker_password):

    if docker_username and docker_password:
        shell_cmd = "docker login -u {0} -p {1} {2}".format(docker_username, docker_password, docker_registry)
        error_msg = "docker registry login error"
        execute_shell(shell_cmd, error_msg)
        print "docker registry login successfully"
    else:
        print "docker registry authentication not provided"



def generate_template_file(cluster_config, service_config):

    image_list = service_config['imagelist']

    for image in image_list:

        if image_list[image]['templatelist'][0] == 'None':
            continue

        for template_file in image_list[image]['templatelist']:
            template_data = read_template("src/{0}/{1}.template".format(image, template_file))
            generate_data = generate_from_template(template_data, cluster_config)
            write_generated_file("src/{0}/{1}".format(image, template_file), generate_data)



def delete_generated_template_file(service_config):

    image_list = service_config['imagelist']

    for image in image_list:

        if image_list[image]['templatelist'][0] == 'None':
            continue

        for template_file in image_list[image]['templatelist']:
            file_path = "src/{0}/{1}".format(image, template_file)

            if os.path.exists(file_path):
                shell_cmd = "rm -rf {0}".format(file_path)
                error_msg = "failed to rm {0}".format(file_path)
                execute_shell(shell_cmd, error_msg)



def copy_arrangement(service_config):

    image_list = service_config['imagelist']

    for image in image_list:

        if 'copy' not in image_list[image]:
            continue

        dst = "src/{0}/copied_file".format(image)

        if os.path.exists(dst) == False :
            shell_cmd = "mkdir -p {0}".format(dst)
            error_msg = "failed to mkdir -p {0}".format(dst)
            execute_shell(shell_cmd, error_msg)

        for copy_item_path in image_list[image]['copy']:
            shell_cmd = "cp -r {0} {1}".format(copy_item_path, dst)
            error_msg = "failed to copy {0}".format(copy_item_path)
            execute_shell(shell_cmd, error_msg)



def copy_cleanup(service_config):

    image_list = service_config['imagelist']

    for image in image_list:

        if 'copy' not in image_list[image]:
            continue

        dst = "src/{0}/copied_file".format(image)

        if os.path.exists(dst) == False:
            continue

        for copy_item_path in image_list[image]['copy']:
            shell_cmd = "rm -rf {0}".format(dst)
            error_msg = "failed to rm {0}".format(copy_item_path)
            execute_shell(shell_cmd, error_msg)



def dependency_solve(service_config, image_name, created_image, prefix):

    if image_name == 'None':
        return
    if image_name in created_image:
        return
    print created_image
    dependency_solve(service_config, service_config['imagelist'][image_name]['prerequisite'], created_image, prefix)

    subprocess.check_call(
        "docker build -t {0}/{1} src/{1}/".format(prefix, image_name),
        shell=True
    )

    created_image[image_name] = True



def build_docker_images(cluster_config, service_config):

    image_list = service_config['imagelist']
    created_image = {}

    for image in image_list:
        dependency_solve(
            service_config, image, created_image,
            cluster_config['clusterinfo']['dockerregistryinfo']['docker_namespace']
        )

    print "success building all docker images"



def push_docker_images(cluster_config, service_config):

    image_list = service_config['imagelist']

    docker_registry_info = cluster_config['clusterinfo']['dockerregistryinfo']
    docker_registry = docker_registry_info['docker_registry_domain']
    docker_namespace = docker_registry_info['docker_namespace']

    if docker_registry == 'public':
        prefix = docker_namespace
    else:
        prefix = "{0}/{1}".format( docker_registry, docker_namespace )

    for image in image_list:

        try:
            if docker_registry != 'public':
                subprocess.check_call(
                    "docker tag {0}/{1} {2}/{0}/{1}".format(docker_namespace, image, docker_registry),
                    shell=True
                )
        except subprocess.CalledProcessError as dockertagerr:
            print "failed to tag {0}".format(image)
            sys.exit(1)

        try:
            subprocess.check_call(
                "docker push {0}/{1}".format(prefix, image),
                shell=True
            )
        except subprocess.CalledProcessError as dockerpusherr:
            print
            "failed to push {0}".format(image)
            sys.exit(1)

    print "success push all the images"



def hadoop_binary_remove(hadoop_version):
    binary_path =  "src/hadoop-run/hadoop".format( hadoop_version )
    if os.path.exists(binary_path):
        try:
            subprocess.check_call(
                "rm -rf {0}".format( binary_path ),
                shell = True
            )
        except subprocess.CalledProcessError as rmerr:
            print "failed to rm hadoop"
            sys.exit(1)



def hadoop_binary_prepare(custom_hadoop_path, hadoop_version):

    if os.path.exists("src/hadoop-run/hadoop") != True:
        shell_cmd = "mkdir -p src/hadoop-run/hadoop"
        error_msg = "failed to create folder src/hadoop-run/hadoop"
        execute_shell(shell_cmd, error_msg)

    if custom_hadoop_path != "None":
        try:
            subprocess.check_call(
                "cp {0} src/hadoop-run/hadoop".format( custom_hadoop_path ),
                shell = True
            )
        except subprocess.CalledProcessError as cperr:
            print "failed to cp hadoop binary"
            sys.exit(1)
    else:
        url = "http://archive.apache.org/dist/hadoop/common/{0}/{0}.tar.gz".format("hadoop-" + hadoop_version)
        try:
            subprocess.check_call(
                "wget {0} -P src/hadoop-run/hadoop".format( url ),
                shell = True
            )
        except subprocess.CalledProcessError as wgeterr:
            print "failed to wget hadoop binary"
            sys.exit(1)



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--path', required=True, help="path to cluster configuration file")

    args = parser.parse_args()

    cluster_config = load_yaml_config( args.path )
    service_config = load_yaml_config( "service.yaml" )

    hadoop_version = cluster_config['clusterinfo']['hadoopinfo']['hadoopversion']
    custom_hadoop_path = cluster_config['clusterinfo']['hadoopinfo']['custom_hadoop_binary_path']

    hadoop_binary_remove(hadoop_version)
    hadoop_binary_prepare(custom_hadoop_path, hadoop_version)

    docker_registry_info = cluster_config['clusterinfo']['dockerregistryinfo']
    docker_registry = docker_registry_info['docker_registry_domain']
    docker_username = docker_registry_info['docker_username']
    docker_password = docker_registry_info['docker_password']

    if docker_registry == "public":
        docker_registry = ""

    login_docker_registry(docker_registry, docker_username, docker_password)

    generate_template_file(cluster_config, service_config)

    copy_arrangement(service_config)
    build_docker_images(cluster_config, service_config)
    copy_cleanup(service_config)

    hadoop_binary_remove(hadoop_version)
    delete_generated_template_file(service_config)


    push_docker_images(cluster_config, service_config)



if __name__ == "__main__":
    main()


