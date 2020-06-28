#/bin/bash

docker run -v {{ base_dir_repo }}:/repo -v {{ playbook_dir }}/.output:/output  golang:1.14 "apt-get -y update && cd /repo && make build && cp bin/virtual-kubelet /output"