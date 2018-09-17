## Service Image Build

Assume the path of your cluster-configuration is ```/pathConfig```


## Build Image

#### Build All The Services' Image

```
./paictl image build -p /pathConfig
```

#### Build A Specific Service's Image

```
./paictl image build -p /pathConfig -n service-name
```


## Push the Image to the Registry in your cluster-configuration

- You should have the password and username of the target registry.
- If you don't have a docker registry, you could choose our public registry to pull the image.


#### Push All the Services's Image
```
./paictl image push -p /pathConfig
```

#### Push A Specific service's Image
```
./paictl image push -p /pathConfig -n service-name
```