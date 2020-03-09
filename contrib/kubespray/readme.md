### Deploy Kubernetes with [kubespray](https://kubespray.io/#/).

#### Why kubespray

Compared with paictl, by which we deployed kubernetes before, kubespray can deploy a kubernetes with perfect function. And it's based on kube

#### Kubespray version

```
release-2.11
```

#### Machine Requirement

- Dev Box Machine (Control Node for Ansible)
    - Kubespray Requirement
        - Ubuntu 16.04 (18.04 should work, but not fully tested.)
        - Server can communicate with all other machine (infra and worker)
        - SSH service is enabled and share the same username/password and have sudo privilege
        - Passwordless ssh to all other machine (infra and worker)
        - Be separate from cluster which contains infra machines and worker machines   
    - OpenPAI Requirement
        - Docker is installed, and it is used to start up dev-box container for service deployment
    
- Infra Machines:
    - Kubespray Requirement
        - Assign each server a **static IP address**, and make sure servers can communicate each other. 
        - Server can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.
        - SSH service is enabled and share the same username/password and have sudo privilege.
        - NTP service is enabled, and etcd is depended on it.
    - OpenPAI Requirement
        - Ubuntu 16.04 (18.04 should work, but not fully tested.)
        - **Docker is installed.**
        - OpenPAI reserves memory and CPU for service running, so make sure there are enough resource to run machine learning jobs. Check hardware requirements for details.
        - Dedicated servers for OpenPAI. OpenPAI manages all CPU, memory and GPU resources of servers. If there is any other workload, it may cause unknown problem due to insufficient resource.

- Worker Machines:
    - Kubespray Requirement
        - Assign each server a **static IP address**, and make sure servers can communicate each other. 
        - Server can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.
        - SSH service is enabled and share the same username/password and have sudo privilege.
    - OpenPAI Requirement
        - Ubuntu 16.04 (18.04 should work, but not fully tested.)
        - **GPU driver is installed.** 
        - **Docker is installed.**
        - **Nvidia docker runtime or other device runtime is installed. And be configured as the default runtime of docker. Please configure it in [docker-config-file](https://docs.docker.com/config/daemon/#configure-the-docker-daemon), because kubespray will overwrite systemd's env.**
            - An example of ```/etc/docker/daemon.json``` to configure nvidia-runtime as default runtime.
                ```json
                {
                  "default-runtime": "nvidia",
                  "runtimes": {
                      "nvidia": {
                          "path": "/usr/bin/nvidia-container-runtime",
                          "runtimeArgs": []
                      }
                  }
                }
                ```
        - OpenPAI reserves memory and CPU for service running, so make sure there are enough resource to run machine learning jobs. Check hardware requirements for details.
        - Dedicated servers for OpenPAI. OpenPAI manages all CPU, memory and GPU resources of servers. If there is any other workload, it may cause unknown problem due to insufficient resource.
        
#### Check requirement

- [Tutorial of checking environment](./doc/requirement.md)

#### Deployment

- Deploy OpenPAI with kubespray. **Recommended**.
    - [Quick Start](./doc/quick-start.md)
    - [Step by Step](./doc/step-by-step.md)
    - [FAQs and Troubleshooting](./doc/faqs-and-troubleshooting.md)
- [Deploy OpenPAI with paictl from end to end. **Not Recommended**.](../../docs/pai-management/README.md)

    
