ROCm Container Runtime
======================

rocm-container-runtime is a wrapper for [runc](https://github.com/opencontainers/runc).

If environment variable `AMD_VISIBLE_DEVICES` is set in OCI config,
the runtime will inject necessary fields into OCI config to use AMD GPUs in containers.

The runtime is the same as [ROCm-docker](https://github.com/RadeonOpenCompute/ROCm-docker) on the host, but provides flexibility for AMD GPUs on Kubernetes.

The runtime achieves similar functionality to [nvidia-container-runtime](https://github.com/NVIDIA/nvidia-container-runtime), but is for AMD GPUs on [ROCm Platform](https://rocm.github.io/).


Installation
------------

```sh
git clone https://github.com/abuccts/rocm-container-runtime
cd rocm-container-runtime
# you can edit rocm-container-runtime.conf for configurations
bash install.sh
```

> NOTE: the runtime only works for Debian distributions currenly, changes are needed for other Linux distributions.


Docker Engine Setup
-------------------

* Docker daemon configuration file

    Add the following fields into `/etc/docker/daemon.json` and restart Docker service:
    ```json
    {
      "runtimes": {
        "rocm": {
          "path": "/usr/bin/rocm-container-runtime",
          "runtimeArgs": []
        }
      }
    }
    ```

    You can optionally set it to default runtime in `/etc/docker/daemon.json`:
    ```json
    "default-runtime": "rocm"
    ```


Docker Usage
------------

```sh
# use 4 AMD GPUs
docker run --runtime=rocm -e AMD_VISIBLE_DEVICES=0,1,2,3 --security-opt seccomp=unconfined rocm/rocm-terminal rocminfo

# use the 3rd AMD GPU
docker run --runtime=rocm -e AMD_VISIBLE_DEVICES=2 --security-opt seccomp=unconfined rocm/rocm-terminal rocminfo
```

> NOTE: To use AMD GPUs in Docker, please follow [ROCm's document](https://rocm.github.io/ROCmInstall.html#Ubuntu) to install drivers first.
