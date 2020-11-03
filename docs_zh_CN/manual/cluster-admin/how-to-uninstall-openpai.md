# 如何卸载OpenPAI

OpenPAI 的卸载是不可逆的：所有数据将被删除，无法找回。如果需要备份，请在卸载之前完成备份。

首先，登录到 dev box机器 删除所有的 PAI 服务：

```bash
./paictl.py service delete
```

现在所有的 PAI 服务和数据都将被删除。如果想要删除 Kubernetes，请进入[`~/pai-deploy/kubespray` 文件夹](installation-guide.md#keep-a-folder)，运行：

```bash
ansible-playbook -i inventory/pai/hosts.yml reset.yml --become --become-user=root -e "@inventory/pai/openpai.yml"
```

建议保留文件夹 `~/pai-deploy` 以重新安装。