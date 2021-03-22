# 如何调试任务

本文档介绍了如何使用SSH和TensorBoard插件调试任务。

**注:** 当IP地址用户可访问时（不是用户无法访问的集群内部IP），这两个插件才能正常工作。 因此，如果PAI部署在某些云环境（例如Azure）中，则这两个插件将无法工作。

## 如何使用SSH

OpenPAI提供SSH插件来帮助您连接到任务容器。
通过使用SSH密钥，您可以作为root用户连接到任务容器。
要使用SSH，您可以使用提前保存的密钥或者为任务单独创建一个SSH密钥对。

- 在用户个人资料页面上检查现有的SSH密钥，您可以在`SSH Public Keys`部分中添加公钥。
此处保存的SSH密钥可以在所有任务中重复使用，因此我们建议您在此处保存常用的SSH密钥，以避免为不同的任务生成密钥和复制粘贴密钥。

  <img src="./imgs/view-profile.png" width="100%" height="100%" />

- 提交任务时，打开右侧的`Tools`面板，然后单击`Enable User SSH`;
- 如果您没有预先保存的SSH公钥，或者想为此任务使用新的SSH密钥对，请单击`Generator`，将生成一对SSH密钥。
请下载SSH私钥，然后单击`Use Public Key`按钮以在此任务中使用此密钥对。您也可以自己生成SSH密钥对，并将公钥粘贴到此处。
- 您将能够使用**与您在用户个人资料页面上保存的公钥相对应的所有SSH私钥**以及**为该任务生成的私钥**连接到任务容器。
- 要查看连接信息，请点击`View SSH Info`按钮，

   <img src="./imgs/view-ssh-info.png" width="100%" height="100%" />

   您将获得相应的命令：
   ```bash
   1. Use your default SSH private key:

   ssh -p <ssh-port> root@<container-ip>

   2. Use a pre-downloaded SSH private key:

   On Windows:
   ssh -p <ssh-port> -i <your-private-key-file-path> root@<container-ip>

   On Unix-like System:
   chmod 400 <your-private-key-file-path> && ssh -p <ssh-port> -i <your-private-key-file-path> root@<container-ip>
   ```

## 如何使用TensorBoard插件

[TensorBoard](https://www.tensorflow.org/guide/summaries_and_tensorboard) 是一个提供TensorFlow程序运行日志可视化的Web程序。

我们利用一个示例向您展示如何在OpenPAI中使用TensorBoard。首先，打开任务提交页面，在`Command`框中输入以下命令：

```bash
git clone https://github.com/microsoft/pai.git
cd pai
git reset --hard dd08930431d05ed490cf7ceeecd262e473c187cd
cd docs/user/samples/
python minist_tensorboard.py --data_dir ./data --log_dir /mnt/tensorboard
sleep 30m
```

然后，请选择`TensorFlow 1.15.0 + Python 3.6 with GPU, CUDA 10.0`作为您的Docker镜像。 最后，在`Tools`部分中点击`Enable TensorBoard`按钮。

   <img src="./imgs/enable-tensorboard.png" width="100%" height="100%" />

提交后，您将在任务详情页面上看到一个`Go To TensorBoard Page`按钮。

   <img src="./imgs/go-to-tensorboard-page.png" width="100%" height="100%" />

点击该按钮可转到TensorBoard页面。 在日志准备就绪前，您可能需要等待几分钟。

   <img src="./imgs/tensorboard-ok.png" width="100%" height="100%" />

一般来说，要使用TensorBoard插件，您应该：

  1. 将您的TensorFlow Summary文件保存到`/mnt/tensorboard`。
  2. 确保您使用的Docker镜像中已安装`tensorboard`。
  3. 如果您想在任务完成后使用TensorBoard，请使用`sleep`命令来延长任务时间。
