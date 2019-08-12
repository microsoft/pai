# Tensorboard plugin

## Goal
The tensorboard plugin 

## Schema
```
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: tensorboard
      parameters:
        port: int
        logdir:
          name1: path1
          name2: path2
```