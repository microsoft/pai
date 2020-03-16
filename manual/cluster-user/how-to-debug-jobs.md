# How to Debug Jobs

## How to use SSH

OpenPAI provides SSH plugin for you to connect to job containers. To use it, you can either create an SSH key pair, or use your own pre-generated keys.

**Option 1. Create an SSH Key Pair**

It is feasible to create an SSH key pair when you submit the job. First, open the `Tools` panel, enable the SSH plugin, then click `SSH Key Generator`:

   <img src="/manual/cluster-user/ssh-click-generator.png" width="60%" height="60%" />

The generator will generate one public key and one private key for you. Please download SSH private key then click `Use Public Key` button to use this key pair in job. 


   <img src="/manual/cluster-user/ssh-generator.png" width="60%" height="60%" />

After job submitted, you can ssh to job containers as user root with the downloaded private key through container ip and ssh port. The `View SSH Info` button will help you:


   <img src="/manual/cluster-user/view-ssh-info.png" width="100%" height="100%" />

To be detailed, you should refer to the `Use a pre-downloaded SSH private key` section.

If you are using Windows, the following command is for you:

```bash
ssh -p <ssh-port> -i <your-private-key-file-path> root@10.a.b.c
```

On a Unix-like System, the command is:

```bash
chmod 400 <your-private-key-file-path> && ssh -p <ssh-port> -i <your-private-key-file-path> root@10.a.b.c
```


**Option 2. Use your Own Keys**

If you are familiar with SSH key authorization, you would probably have generated a public key and a private key already, in the folder `C:\Users\<your-user-name>\.ssh` (it is `~/.ssh/` on a Unix-like system). In such folder, there is an `id_rsa.pub` file and an `id_rsa` file, which are the public key and the private key, respectively. 

To use them, open the `id_rsa.pub` and copy its content to the SSH plugin, then submit the job. Do not use the key generator.

   <img src="/manual/cluster-user/copy-ssh-public-key.png" width="60%" height="60%" />

After submission, you can use `ssh -p <ssh-port> root@<container-ip>` to connect to the job container, directly.

## How to use TensorBoard Plugin