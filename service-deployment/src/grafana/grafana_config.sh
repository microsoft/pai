#!/bin/bash

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


# Variables illustrate:
# ${DATASOURCES_PATH}, ${DASHBOARDS_PATH}, ${USER} & ${PASSWORD}, passed from K8s deployment yaml files or "docker run" parameters, 
# if not, they are set as default values defined in this file.


# Script to configure grafana datasources and dashboards.
# Intended to be run before grafana entrypoint...

DATASOURCES_PATH=${DATASOURCES_PATH:-/usr/local/grafana/datasources}
DASHBOARDS_PATH=${DASHBOARDS_PATH:-/usr/local/grafana/dashboards}
USER=${USER:-admin}
PASSWORD=${PASSWORD:-admin}


# Generic function to call the Vault API
grafana_api() {
  local verb=$1
  local url=$2
  local params=$3
  local bodyfile=$4
  local response
  local cmd

  cmd="curl -k -u ${USER}:${PASSWORD} -H \"Accept: application/json\" -H \"Content-Type: application/json\" -X ${verb} -k ${GRAFANA_URL}${url}"
  [[ -n "${params}" ]] && cmd="${cmd} -d \"${params}\""
  [[ -n "${bodyfile}" ]] && cmd="${cmd} --data @${bodyfile}"
  echo "Running ${cmd}"
  eval ${cmd} || return 1
  return 0
}

wait_for_api() {
  while ! grafana_api GET /api/datasources
  do
    sleep 3
  done
}

install_datasources() {
  local datasource

  for datasource in ${DATASOURCES_PATH}/*.json
  do
    if [[ -f "${datasource}" ]]; then
      echo "Installing datasource ${datasource}"
      if grafana_api POST /api/datasources "" "${datasource}"; then
        echo "installed ok"
      else
        echo "install failed"
      fi
    fi
  done
}


install_dashboards() {
  local dashboard

  for dashboard in ${DASHBOARDS_PATH}/*
  do
    if [[ -f "${dashboard}" ]]; then
      echo "Installing dashboard ${dashboard}"
      if grafana_api POST /api/dashboards/import "" "${dashboard}"; then
        echo "installed ok"
      else
        echo "install failed"
      fi
    fi
  done
}

configure_grafana() {
  wait_for_api
  # move js script to the specific dir
  # http://docs.grafana.org/reference/scripting/#scripted-dashboards
  cp ${DASHBOARDS_PATH}/*.js /usr/share/grafana/public/dashboards/
  install_datasources
  install_dashboards
}

echo "Running configure_grafana in the background..."
configure_grafana

