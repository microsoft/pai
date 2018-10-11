## Table of Contents:
- [Introduction](#Introduction)
- [Testing Process](#Testing_Process)
  - [Running the testing project on PAI](#Running_on_PAI)
  - [Running the testing project locally](#Running_on_local_machine)
  - [Parameters of the project](#Parameters_of_the_start.sh)
  - [The mode of the project](#mode)
- [Note](#Note)

## Introduction <a name="Introduction"></a>
This python project can help you test all the examples in this folder. 
It is a semi-automatic testing tool which could make your testing work more easy.
Just read the following "Testing Process" section and run this testing project after you having changed the pai project or before you doing your release process. 
## Testing Process <a name="Testing_Process"></a>
You have 2 ways to run the project. 
One is submitting a job on PAI, and the other one is running it on your local machine.
### Running on PAI <a name="Running_on_PAI"></a>
1. Submit the job onto PAI according to the [test_all_examples.json.igr](https://github.com/Microsoft/pai/blob/master/examples/auto-test/test_all_examples.json.igr) in this folder.
You must edit the command with your own parameters. Refer to [Parameters of the start.sh](#Parameters_of_the_start.sh) to edit your parameters.
2. See the job's stdout in the application page.
3. For the succeeded test items, you could do nothing, but it may not mean there is nothing wrong with the job. You'd better check it.
4. For the failed test items, you should check the stdout in application page.
5. There may be some testing jobs can not be submitted on PAI due to formulation error. You can see "The formulation of file finename is wrong!" in stdout. If this happened, check the json file of that job.
### Running on local machine <a name="Running_on_local_machine"></a>
1. Download the project.
2. Build the docker image according to the [dockerfile](https://github.com/Microsoft/pai/blob/master/examples/auto-test/Dockerfile.example.autotest).
`sudo docker build -f Dockerfile.example.autotest -t openpai/pai.example.autotest .`
3. Run a container based on the docker image you built just now.
`sudo docker run -itd --name=my-autotest openpai/pai.example.autotest`
Copy the project into the container.
`sudo docker cp ./pai/examples/auto-test my-autotest:/root/`
4. Execute the container. `sudo docker exec -it my-autotest /bin/bash`
5. Run the start.sh script file and use your own parameters of mode, hdfs_socket, webhdfs_socket, PAI_username,PAI_password and rest_server_socket.
Pay attention to the order, you must give the 6 parameters in the above order. Refer to [Parameters of the start.sh](#Parameters_of_the_start.sh).
`/bin/bash auto-test/start.sh normal 10.20.30.40:9000 http://10.20.30.40:9186/api/v1/user/your_username 10.20.30.40:50070 test test`
6. When you run the script, you should choice the examples you want to test.
See [Parameters of the start.sh](#Parameters_of_the_start.sh) to get the reference.
7. Wait until all jobs are finished.
### Parameters of the start.sh <a name="Parameters_of_the_start.sh"></a>
There are 6 parameters required by start.sh. They are:

- **mode**: the mode you want to enter, you can refer to the [later document](#mode).

- **rest_server_socket**: the socket of rest server of PAI.

- **hdfs_socket**: the socket of hdfs of PAI.

- **webhdfs_socket**: the socket of webhdfs of PAI.

- **PAI_username**: the username of PAI.

- **PAI_password**: the password of PAI.

And during the runtime of this shell script, it will require you input F/S or job names to strict the testing example.

- Enter **F** means you want to run all examples;

- Enter **S** means you want to run only the stable examples;(the others are unstable due to data downloading, see [Note](#Note) to get reference.)

- Enter job names like `cntk-mpi,tensorflow-mpi,sklearn-mnist` means you want to run just the three examples.

Here is an example to start the script: `/bin/bash pai_tmp/examples/auto-test/start.sh normal http://10.20.30.40:9186/api/v1/ 10.20.30.40:9000 http://10.20.30.40:50070 test test`
### mode <a name="mode"></a>
The project offers 3 different modes.
1. **ci mode**: If the job can run correctly within 10 minutes, the project will regards it succeeded.
Use "ci" as the first parameter of start.sh to enter this mode.
2. **release mode**: If the job can run correctly within 60 minutes, the project will regards it succeeded.
Use "release" as the first parameter of start.sh to enter this mode.
3. **normal mode**: If the job can run correctly within 30 minutes, the project will regards it succeeded.
Use "normal" as the first parameter of start.sh to enter this mode.
## Note <a name="Note"></a>
it may due to the official data downloading source being unstable. Just try again!
Now(27th September, 2018), the mpi examples are still unready. Ignore them!
