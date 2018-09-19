###Introduction
This python project can help you test all the examples in this folder. 
It is a semi-automatic testing tool which could make your testing work more easy.
Just read the following "Testing Process" section and run this testing project after you having changed the pai project or before you doing your release process. 
###Testing Process
You have 2 ways to run the project. 
One is submitting a job on PAI, and the other one is running it on your local machine.
####Running on PAI
1. Submit the job onto PAI according to the [test_examples.json]() in this folder.
You must edit the command with your own parameters. Refer to [Parameters of the start.sh](#Parameters of the start.sh) to edit your parameters.
2. See the job's stdout in the application page.
3. For the succeeded test items, you could do nothing, but it may not mean there is nothing wrong with the job. You'd better check it.
4. For the failed test items, you should check the stdout in application page.
5. There may be some testing jobs can not be submitted on PAI due to formulation error. You can see "The formulation of file finename is wrong!" in stdout. If this happened, check the json file of that job.
####Running on local machine
1. Download the project.
2. Build the docker image according to the [dockerfile]().
`sudo docker build -f Dockerfile.example.autotest -t openpai/pai.example.autotest .`
3. Run a container based on the docker image you built just now.
`sudo docker run -itd --name=my-autotest openpai/pai.example.autotest`
Copy the project into the container.
`sudo docker cp ./pai/examples/auto-test my-autotest:/root/`
4. Execute the container. `sudo docker exec -it my-autotest /bin/bash`
5. Run the start.sh script file and use your own parameters of mode, hdfs_socket, webhdfs_socket, PAI_username,PAI_password and rest_server_socket.
Pay attention to the order, you must give the 6 parameters in the above order. Refer to [Parameters of the start.sh](#Parameters of the start.sh).
`/bin/bash auto-test/start.sh normal 10.20.30.40:9000 http://10.20.30.40:9186/api/v1/ 10.20.30.40:50070 test test`
6. Wait until all jobs are finished.
####Parameters of the start.sh
There are 6 parameters required by start.sh. They are:
**mode**: the mode you want to enter, you can refer to the [later document](#mode).
**rest_server_socket**: the socket of rest server of PAI.
**hdfs_socket**: the socket of hdfs of PAI.
**webhdfs_socket**: the socket of webhdfs of PAI.
**PAI_username**: the username of PAI.
**PAI_password**: the password of PAI.
####mode
The project offers 3 different modes.
1. **ci mode**: If the job can run correctly within 10 minutes, the project will regards it succeeded.
Use "ci" as the first parameter of start.sh to enter this mode.
2. **release mode**: If the job can run correctly within 60 minutes, the project will regards it succeeded.
Use "release" as the first parameter of start.sh to enter this mode.
3. **normal mode**: If the job can run correctly within 30 minutes, the project will regards it succeeded.
Use "normal" as the first parameter of start.sh to enter this mode.
###Note
If the sklearn-mnist, keras_cntk_backend_mnist, keras_tensorflow_backend_mnist, mxnet-autoencoder or tensorflow-cifar10 job failed,
it may due to the official data downloading source being unstable. Just try again!