## Build hadoop-ai in docker container


```yaml

sudo docker build -t hadoop-build .

sudo docker run --rm --name=hadoop-build --volume=/hadoop-binary:/hadoop-binary hadoop-build

```


Then you will find hadoop binary in the path ```/hadoop-binary```
