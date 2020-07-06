#/bin/bash

docker run --rm -v {{ base_dir_repo }}:/repo -v {{ playbook_dir }}/.output:/output  golang:1.14  /bin/bash -c  "cd /repo; make build; cp bin/virtual-kubelet /output"