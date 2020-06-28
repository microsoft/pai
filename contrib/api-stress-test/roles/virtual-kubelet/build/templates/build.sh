#/bin/bash

docker run golang:1.14 -v {{ base_dir_repo }}:/repo -v {{ playbook_dir }}/.output:/output "cd /repo && make build && cp bin/virtual-kubelet /output"