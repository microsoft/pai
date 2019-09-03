# TensorBoard plugin

## Goal
The tensorboard plugin 

## Schema
```yaml
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: tensorboard
      parameters:
        port: int
        logdir:
          name1: path1
          name2: path2
```