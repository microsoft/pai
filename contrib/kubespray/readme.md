### Deploy Kubernetes with kubepsray

#### Machine Requirement

- Dev Box Machine (Control Node for Ansible)
    - Ubuntu 16.04 (18.04 should work, but not fully tested.)
    - Server can communicate with all other machine (infra and worker)
    - SSH service is enabled and share the same username/password and have sudo privilege
    - Passwordless ssh to all other machine (infra and worker)
    - Docker installed
    
- Infra Machines:
    - Ubuntu 16.04 (18.04 should work, but not fully tested.)
    - Assign each server a **static IP address**, and make sure servers can communicate each other. 
    - Server can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images of OpenPAI.
    - SSH service is enabled and share the same username/password and have sudo privilege.
    - NTP service is enabled.
    - OpenPAI reserves memory and CPU for service running, so make sure there are enough resource to run machine learning jobs. Check hardware requirements for details.
    - Dedicated servers for OpenPAI. OpenPAI manages all CPU, memory and GPU resources of servers. If there is any other workload, it may cause unknown problem due to insufficient resource.

- Worker Machines:
    - Ubuntu 16.04 (18.04 should work, but not fully tested.)
    - **GPU driver is installed.**
    - **Nvidia docker runtime is installed.**
    - Assign each server a **static IP address**, and make sure servers can communicate each other. 
    - Server can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images of OpenPAI.
    - SSH service is enabled and share the same username/password and have sudo privilege.
    - NTP service is enabled.
    - OpenPAI reserves memory and CPU for service running, so make sure there are enough resource to run machine learning jobs. Check hardware requirements for details.
    - Dedicated servers for OpenPAI. OpenPAI manages all CPU, memory and GPU resources of servers. If there is any other workload, it may cause unknown problem due to insufficient resource.

#### Deployment

- [Quick Start](./doc/quick-start.md)
- [Step by Step](./doc/step-by-step.md)