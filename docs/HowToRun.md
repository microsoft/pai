# How to install and run MT Webportal
## 1. start nginx
Run \mtExternalService\Nginx\start.bat

## 2. start zookeeper
Pre-requisite: Install java SDK and set JAVA_HOME correctly

Download zookeeper 3.4.5 from https://archive.apache.org/dist/zookeeper/zookeeper-3.4.5/zookeeper-3.4.5.tar.gz  
Extract the tarball  
Copy ${ZookeeperPath}/conf/zoo_sample.cfg to ${ZookeeperPath}/conf/zoo.cfg  
Run ${ZookeeperPath}/bin/zkServer.cmd  

## 3. start restful server
Pre-requisite: Start nginx and zookeeper locally

$ cd pai/src/rest-server  
$ nvm use 8  
$ npm install  
$ npm start  
```
note: make sure you have correct .env file and oidc.ini.flattened.ini file before start restful server.
```

## 4. start webportal

$ cd pai/src/webportal  
$ npm install  
$ npm run dev  
