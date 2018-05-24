<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->


# REST Server

REST Server 提供一系列用于管理 jobs 的 API 接口。

## 快速开始

1. 准备 job 配置文件
    参考 [PAI 深度学习指南 - job 配置文件](../job-tutorial/README-zh.md#job-配置文件) 准备 job配置文件，假设命名为`exampleJob.json`。

2. 认证
    HTTP POST 你的用户名和密码至以下 uri，获取访问令牌：

    ```
    http://restserver/api/v1/token
    ```
    例如，使用 [curl](https://curl.haxx.se/) 执行以下命令：
    ```sh
    curl -H "Content-Type: application/x-www-form-urlencoded" \
         -X POST http://restserver/api/v1/token \
         -d "username=YOUR_USERNAME" -d "password=YOUR_PASSWORD"
    ```

3. 提交 job
    HTTP POST job 配置文件到以下 uri，并且在 header 部分使用上一步得到的访问令牌。
    ```
    http://restserver/api/v1/jobs
    ```
    例如：
    ```sh
    curl -H "Content-Type: application/json" \
         -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
         -X POST http://restserver/api/v1/jobs \
         -d @exampleJob.json
    ```

4. 监控 job

    获取 job 列表：
    ```
    http://restserver/api/v1/jobs
    ```
   获取名为 “exampleJob” job 的状态：
    ```
    http://restserver/api/v1/jobs/exampleJob
    ```
   获取 JSON格式的 job 配置文件：
    ```
    http://restserver/api/v1/jobs/exampleJob/config
    ```
   获取 job 的 SSH信息
    ```
    http://restserver/api/v1/jobs/exampleJob/ssh
    ```

## RestAPI

### Root URI
在 [services-configuration.yaml](../cluster-configuration/services-configuration.yaml) 中配置 rest server 的端口。

### API

1. `POST token`

    在系统中进行身份验证并获取访问令牌。

    *请求*
    ```
    POST /api/v1/token
    ```

    *参数*
    ```
    {
      "username": "你的用户名",
      "password": "你的密码",
      "expiration": "登录有效时间，以秒为单位"
    }
    ```

    *成功响应*
    ```
    {
      "token": "生成的访问令牌",
      "user": "用户名"
    }
    ```

    *失败响应*
    ```
    Status: 401

    {
      "error": "AuthenticationFailed",
      "message": "authentication failed"
    }
    ```

2. `PUT user`

    更新系统中的用户。
    管理员可以添加或更改其他用户的密码；用户可以更改自己的密码。

    *请求*
    ```
    PUT /api/v1/user
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *参数*
    ```
    {
      "username": "用户名，格式为：[_A-Za-z0-9]+",
      "password": "密码，至少六个字符",
      "admin": true | false,
      "modify": true | false
    }
    ```

    *成功响应*
    ```
    {
      "message": "update successfully"
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "UpdateFailed",
      "message": "update failed"
    }
    ```

3. `DELETE user` （需管理员权限）
    
    从系统中删除用户。

    *请求*
    ```
    DELETE /api/v1/user
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *参数*
    ```
    {
      "username": "要移除的用户名"
    }
    ```

    *成功响应*

    ```
    Status: 200
  
    {
      "message": "remove successfully"
    }
    ```

    *失败响应*

    ```
    Status: 500

    {
      "error": "RemoveFailed",
      "message": "remove failed"
    }
    ```
  
    *未经授权时响应*

    ```
    Status: 401

    {
      "error": "NotAuthorized",
      "message": "not authorized"
    }
    ```

4. `PUT user/:username/virtualClusters` （需管理员权限）

    管理员可以更新其他用户的虚拟集群。管理员可以访问所有的虚拟集群，普通用户能访问默认虚拟集群。

    *请求*
    ```
    PUT /api/v1/user/:username/virtualClusters
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *参数*
    ```
    {
      "virtualClusters": "虚拟集群列表，以逗号分隔 (例如： vc1,vc2)"
    }
    ```

    *成功响应*
    ```
    Status: 201

    {
      "message": "update user virtual clusters successfully"
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "UpdateVcFailed",
      "message": "update user virtual cluster failed"
    }
    ```

    *未经授权时响应*
    ```
    Status: 401

    {
      "error": "NotAuthorized",
      "message": "not authorized"
    }
    ```

5. `GET jobs`

    获取 jobs 列表。

    *请求*
    ```
    GET /api/v1/jobs
    ```

    *参数*
    ```
    {
      "username": "用户名，设置该参数以过滤出该用户提交的 jobs"
    }
    ```

    *成功响应*
    
    得到 jobs 列表，格式如下：
    ```
    {
      [ ... ]
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "GetJobListError",
      "message": "get job list error"
    }
    ```

6. `GET jobs/:jobName`

    获取系统中的 job 状态。

    *请求*
    ```
    GET /api/v1/jobs/:jobName
    ```

    *成功响应*
    ```
    {
      name: "jobName",
      state: "jobState",
      createdTime: "createdTimestamp",
      completedTime: "completedTimestamp",
      appId: "applicationId",
      appProgress: "applicationProgress",
      appTrackingUrl: "applicationTrackingUrl",
      appLaunchedTime: "applicationLaunchedTimestamp",
      appCompletedTime: "applicationCompletedTimestamp",
      appExitCode: applicationExitCode,
      appExitDiagnostics: "applicationExitDiagnostics"
    }
    ```

    *job 不存在时响应*
    ```
    Status: 404

    {
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```

7. `POST jobs`

    提交 job。

    *请求*
    ```
    POST /api/v1/jobs
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *参数*

    参阅 [job 配置文件](../job-tutorial/README-zh.md#job-配置文件)

    *成功请求*
    ```
    Status: 201

    {
      "message": "update job $jobName successfully"
    }
    ```

    *重复提交时响应*
    ```
    Status: 400
    
    {
      "error": "JobUpdateError",
      "message": "job update error"
    }
    ```
    
    *失败响应*
    ```
    Status: 500

    {
      "error": "JobUpdateError",
      "message": "job update error"
    }
    ```

8. `GET jobs/:jobName/config`
   
     获取 JSON 格式的 job 配置信息。

    *请求*
    ```
    GET /api/v1/jobs/:jobName/config
    ```

    *成功响应*
    ```
    {
      "jobName": "test",
      "image": "pai.run.tensorflow",
      ...
    }
    ```

    *job 不存在时响应*
    ```
    Status: 404

    {
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "InternalServerError",
      "message": "<depends on the error>"
    }
    ```

9. `GET jobs/:jobName/ssh`

    获取 job SSH 信息。

    *请求*
    ```
    GET /api/v1/jobs/:jobName/ssh
    ```

    *成功响应*
    ```
    {
      "containers": [
        {
          "id": "<container id>",
          "sshIp": "<ip to access the container's ssh service>",
          "sshPort": "<port to access the container's ssh service>"
        },
        ...
      ],
      "keyPair": {
        "folderPath": "HDFS path to the job's ssh folder",
        "publicKeyFileName": "file name of the public key file",
        "privateKeyFileName": "file name of the private key file",
        "privateKeyDirectDownloadLink": "HTTP URL to download the private key file"
      }
    }
    ```

    *job 不存在时响应*
    ```
    Status: 404

    {
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "InternalServerError",
      "message": "<depends on the error>"
    }
    ```

10. `PUT jobs/:jobName/executionType`
    
    启动或停止 job。

    *请求*
    ```
    PUT /api/v1/jobs/:jobName/executionType
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *参数*
    ```
    {
      "value": "START" | "STOP"
    }
    ```

    *成功响应*
    ```
    Status: 200

    {
      "message": "execute job $jobName successfully"
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "JobExecuteError",
      "message": "job execute error"
    }

11. `GET virtual-clusters`
    
    获取虚拟集群列表。

    *请求*
    ```
    GET /api/v1/virtual-clusters
    ```

    *成功响应*
    ```
    {
      "vc1": 
      {
      }
      ...
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "GetVirtualClusterListError",
      "message": "get virtual cluster list error"
    }
    ```
    
12. `GET virtual-clusters/:vcName`

    获取系统中虚拟集群状态。

    *请求*
    ```
    GET /api/v1/virtual-clusters/:vcName
    ```

    *成功响应*
    ```
    {
      // 该虚拟集群的可用容量占整个集群的百分比
      "capacity":50,
      // 该虚拟群的最大容量占整个集群的百分比      
      "maxCapacity":100,
      // 该虚拟集群已使用容量占整个集群的百分比
      "usedCapacity":0,
      "numActiveJobs":0,
      "numJobs":0,
      "numPendingJobs":0,
      "resourcesUsed":{  
       "memory":0,
       "vCores":0,
       "GPUs":0
      },
    }
    ```

    *该虚拟集群不存在时响应*
    ```
    Status: 404

    {
      "error": "VirtualClusterNotFound",
      "message": "could not find virtual cluster $vcName"
    }
    ```

    *失败响应*
    ```
    Status: 500

    {
      "error": "InternalServerError",
      "message": "internal server error"
    }
    ```