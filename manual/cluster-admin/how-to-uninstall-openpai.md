# How to Uninstall OpenPAI

1. [Installation Guide](./installation-guide.md)
2. [Installation FAQs and Troubleshooting](./installation-faqs-and-troubleshooting.md)
3. [Basic Management Operations](./basic-management-operations.md)
4. [How to Manage Users and Groups](./how-to-manage-users-and-groups.md)
5. [How to Setup Kubernetes Persistent Volumes as Storage](./how-to-set-up-pv-storage.md)
6. [How to Set Up Virtual Clusters](./how-to-set-up-virtual-clusters.md)
7. [How to Add and Remove Nodes](./how-to-add-and-remove-nodes.md)
8. [How to use CPU Nodes](./how-to-use-cpu-nodes.md)
9. [How to Customize Cluster by Plugins](./how-to-customize-cluster-by-plugins.md)
10. [Troubleshooting](./troubleshooting.md)
11. [How to Uninstall OpenPAI](./how-to-uninstall-openpai.md) (this document)
12. [Upgrade Guide](./upgrade-guide.md)

The uninstallation of OpenPAI is irreversible: all the data will be removed and you cannot find them back. If you need a backup, do it before uninstallation.

First, log in to the dev box machine and delete all PAI services:

```bash
./paictl.py service delete
```

Now all PAI services and data are deleted. If you want to destroy the Kubernetes cluster too, please go into [`~/pai-deploy/kubespray` folder](installation-guide.md#keep-a-folder), run:

```bash
ansible-playbook -i inventory/pai/hosts.yml reset.yml --become --become-user=root -e "@inventory/pai/openpai.yml"
```

We recommend you to keep the folder `~/pai-deploy` for re-installation.