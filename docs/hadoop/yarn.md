# YARN

This guidance provides users instructions to configure YARN.

# Table of Content
- [ YARN GPU Blacklist ](#YARN_GPU_Blacklist)
    - [ Kubectl ](#kubectl)

# Configured YARN GPU Blacklist <a name="YARN_GPU_Blacklist"></a>

We enhance YARN to support GPU level blacklist, these GPUs will be excluded from scheduling. 
It could be configured by following ways:

## Kubectl <a name="kubectl"></a>
1. create a file called "blacklist", fill it with the blacklist info, as below:
    ```yaml
    # host_ip: blacklist bitmap, 1 means unavailable.
    10.0.0.1: 0010  # blacklist the second GPU
    10.0.0.3: 1100  # blacklist the third and forth GPU
    ```
    
2. upload it to configmap
    ```bash
    kubectl create configmap gpu-blacklist --from-file=blacklist --dry-run -o yaml | kubectl apply --overwrite=true -f -
    ```
    
##Todo:
by paictl or rest-server

