# Build Docker Images with SSH

In OpenPAI, if a Docker image doesn't have openssh-server and curl packages, the SSH feature will not work for it. To build a new image with SSH, please follow the following steps:

1. [Install Docker](https://docs.docker.com/install/)

2. Create a file named "example.Dockerfile", and add the following commands to it. Here we use "ufoym/deepo:pytorch-py36-cu90" as an example. You can replace it with your own Docker images.
```bash
# replace "ufoym/deepo:pytorch-py36-cu90" with your own docker images
FROM ufoym/deepo:pytorch-py36-cu90
RUN apt-get update
RUN apt-get -y install openssh-server curl
```

3. Login to the Docker Hub (If you don't have a Docker ID, please check https://hub.docker.com/signup to signup one)
```bash
# follow the instructions to login
docker login
```

4. Build and push the image with the following commands:
```
 docker build -f example.Dockerfile -t <Your Docker ID>/pytorch-py36-cu90-ssh .
 docker push <Your Docker ID>/pytorch-py36-cu90-ssh
```

5. Now you can use "\<Your Docker ID\>/pytorch-py36-cu90-ssh" in OpenPAI with SSH feature!
