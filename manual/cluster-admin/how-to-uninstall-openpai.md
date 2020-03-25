# How to Uninstall OpenPAI

The uninstallation of OpenPAI is not irreversible: all the data will be removed and you cannot find the back. If you need a backup, do it before uninstallation.

First, log in to the dev box machine and delete all PAI services:

```bash
./paictl.py service delete
```

Now all PAI services and data are deleted. If you want to destroy the Kubernetes cluster too, please go into [~/pai-deploy/kubespray folder](installation-guide.md#keep-a-folder), run:

```bash
ansible-playbook -i inventory/pai/hosts.yml reset.yml --become --become-user=root -e "@inventory/pai/openpai.yml"
```