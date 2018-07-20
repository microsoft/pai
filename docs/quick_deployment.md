# OpenPAI Quick Deployment

## Step 0. Prepare the dev-box

It is recommended to perform the operations below in a dev box.
Please refer to this [section](../pai-management/doc/how-to-setup-dev-box.md) for the details of setting up a dev-box.

## Step 1. Prepare the quick-start.yaml file <a name="step-1a"></a>

An example yaml file is shown below. Note that you should change the IP address of the machine and ssh information accordingly.

```yaml
# quick-start.yaml

# (Required) Please fill in the IP address of the server you would like to deploy OpenPAI
machines:
  - 192.168.1.11
  - 192.168.1.12
  - 192.168.1.13

# (Required) Log-in info of all machines. System administrator should guarantee
# that the username/password pair is valid and has sudo privilege.
ssh-username: pai
ssh-password: pai-password

# (Optional, default=22) Port number of ssh service on each machine.
#ssh-port: 22

# (Optional, default=DNS of the first machine) Cluster DNS.
#dns: <ip-of-dns>

# (Optional, default=10.254.0.0/16) IP range used by Kubernetes. Note that
# this IP range should NOT conflict with the current network.
#service-cluster-ip-range: <ip-range-for-k8s>

```

## Step 2. Generate OpenPAI configuration files

After the quick-start.yaml is ready, use it to generate four configuration yaml files as follows.

```
python paictl.py cluster generate-configuration -i ~/quick-start.yaml -o ~/pai-config -f
```

The command will generate the following four yaml files.

```
cluster-configuration.yaml
k8s-role-definition.yaml
kubernetes-configuration.yaml
serivices-configuration.yaml
```
Please refer to this [section](../pai-management/doc/how-to-write-pai-configuration.md) for the details of the configuration files.

## Step 3. Boot up Kubernetes

Use the four yaml files to boot up k8s.
Please refer to this [section](../pai-management/doc/cluster-bootup.md#step-2) for details.

## Step 4. Start all OpenPAI services

After k8s starts, boot up all OpenPAI services.
Please refer to this [section](../pai-management/doc/cluster-bootup.md#step-3) for details.