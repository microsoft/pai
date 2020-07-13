#!/usr/bin/env python

import os
import datetime
import yaml
import logging.config
import argparse
import subprocess
import sys
import jinja2

logger = logging.getLogger(__name__)

TEMPORARY_DIR_NAME = ".azure_quick_start"


def load_yaml_config(config_path):
    with open(config_path, "r") as f:
        config_data = yaml.load(f, yaml.SafeLoader)
    return config_data


def create_folder_if_not_exist(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)


def execute_shell(shell_cmd, error_msg):
    try:
        subprocess.check_call( shell_cmd, shell=True )
    except subprocess.CalledProcessError:
        logger.error(error_msg)
        sys.exit(1)


def read_template(template_path):
    with open(template_path, "r") as f:
        template_data = f.read()
    return template_data


def generate_from_template_dict(template_data, map_table):
    generated_file = jinja2.Template(template_data).render(
        map_table
    )
    return generated_file


def write_generated_file(file_path, content_data):
    with open(file_path, "w+") as fout:
        fout.write(content_data)


def generate_template_file(template_file_path, output_path, map_table):
    template = read_template(template_file_path)
    generated_template = generate_from_template_dict(template, map_table)
    write_generated_file(output_path, generated_template)


def generate_aks_engine_script(aks_engine_cfg, working_dir, script_dir):
    generate_template_file(
        "{0}/templates/k8s.json.j2".format(script_dir),
        "{0}/k8s.json".format(working_dir),
        {"cfg": aks_engine_cfg}
    )
    generate_template_file(
        "{0}/templates/aks-engine.sh.j2".format(script_dir),
        "{0}/aks-engine.sh".format(working_dir),
        {
            "cfg": aks_engine_cfg,
            "working_dir": working_dir
        }
    )


def main():
    parser = argparse.ArgumentParser(description="OpenPAI at Azure quick start")

    starttime = datetime.datetime.now()
    logger.info("Start to deploy azure {0}".format(starttime))

    parser.add_argument(
        '-c', '--config',
        required=True,
        help='The path of your configuration path.'
    )

    args = parser.parse_args()
    config_path = args.config

    logger.info("Loading aks engine configuration")
    aks_engine_cfg = load_yaml_config(config_path)

    python_script_path = os.path.dirname(os.path.realpath(__file__))
    current_working_dir = os.getcwd()
    aks_engine_working_dir = "{0}/{1}".format(current_working_dir, TEMPORARY_DIR_NAME)
    create_folder_if_not_exist(aks_engine_working_dir)

    generate_aks_engine_script(aks_engine_cfg, aks_engine_working_dir, python_script_path)


if __name__ == "__main__":
    main()

