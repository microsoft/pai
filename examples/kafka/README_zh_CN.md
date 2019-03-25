## How to run kafka on PAI

If you just want to make a very simple example to see whether you can use kafka on PAI, you could submit the job with the kafka.json file in this folder. Then, you can see the stdout in the "Go to Tracking Page" page. You could see that the program has already produced and consumed message with kafka.

OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `Dockerfile.example.kafka` with your own.

### Submit Job

If you could use kafka correctly in your own environment, of course computer or server, you could:

1. build the environment into a docker image.

2. push it into a public registry.

3. submit your job on PAI webportal.

Note: Now(2018-6-26), we can't use static port and dynamic port at the same time, and the job would add two dynamic ports(ssh and http) automatically. So, we could only use dynamic port to support zookeeper and kafka instead of static port. Then the way to use dynamic port is following:

1. Delete the port setting sentences in "zoo.cfg" and "server.properties".

2. Add the sentences you have deleted by using command "sed" and environment variable:
    
    ```bash
    sed -i "13a clientPort=$PAI_CONTAINER_HOST_zookeeper_PORT_LIST" zoo.cfg
    sed -i "123a zookeeper.connect=localhost:$PAI_CONTAINER_HOST_zookeeper_PORT_LIST" server.properties
    sed -i "31a listeners=PLAINTEXT://localhost:$PAI_CONTAINER_HOST_kafka_PORT_LIST" server.properties
    ```

3. Delete the port setting codes in your logic codes.

4. Add the deleted codes by the same way as you doing with the sentences.

5. Make sure you have already put these sed commands in your shell file.

6. Submit your job again!