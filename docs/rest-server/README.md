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

## Goal

REST Server exposes a set of interface that allows you to manage jobs.

## Architecture

REST Server is a Node.js API service for PAI that deliver client requests to different upstream
services, including [FrameworkLauncher](../frameworklauncher/README.md), Apache Hadoop YARN, WebHDFS and
etcd, with some request transformation.

## Dependencies

To start a REST Server service, the following services should be ready and correctly configured.

* [FrameworkLauncher](../frameworklauncher/README.md)
* Apache Hadoop YARN
* HDFS
* etcd

## Build

Run `npm run yarn install` to install dependencies.

## Configuration

If REST Server is deployed by [pai management tool][pai-management], configuration is located in
`restserver` block of [service configuration][service-configuration] file, including:

* `server-port`: Integer. The network port to access the web portal. The default value is 9186.
* `jwt-secret`: A random secret token for user authorization, keep it secret to users.
* `default-pai-admin-username`: The username of default user. REST Server will auto generate it
  after the first start of service.
* `default-pai-admin-password`: The password of default user.

---

If REST Server is deployed manually, the following fields should be configured as environment
variables:

* `LAUNCHER_WEBSERVICE_URI`: URI endpoint of [Framework Launcher](../frameworklauncher/README.md)
* `HDFS_URI`: URI endpoint of HDFS
* `WEBHDFS_URI`: URI endpoint of WebHDFS
* `YARN_URI`: URI endpoint of Apache Hadoop YARN
* `ETCD_URI`: URI endpoints of ectd, could be multiple and separated by comma(`,`)
* `JWT_SECRET`: A random secret token for user authorization, keep it secret to users.
* `DEFAULT_PAI_ADMIN_USERNAME`: The username of default user. REST Server will auto generate it
  after the first start of service.
* `DEFAULT_PAI_ADMIN_PASSWORD`: The password of default user.

And the following field could be configured optionally:

* `LOG_LEVEL`: The log level of the service, default value is `debug`, could be
    * `error`
    * `warn`
    * `info`
    * `debug`
    * `silly`
* `SERVER_PORT`: The network port to access the web portal. The default value is 9186.

## Deployment

The deployment of REST Server goes with the bootstrapping process of the whole PAI cluster, which is described in detail in [Tutorial: Booting up the cluster](../pai-management/doc/cluster-bootup.md).

---

If REST Server is need to be deployed as a standalone service, follow these steps:

1. Go into `rest-server` directory
2. Run `npm start`

## Upgrading

REST Server is a stateless service, so it could be upgraded without any extra operation.

## Service Metrics

TBD

## Service Monitoring

TBD

## High Availability

REST Server is a stateless service, so it could be extends for high availability without any extra operation.

## Runtime Requirements

To run REST Server on system, a [Node.js](https://nodejs.org) 6+ runtime is required, with [npm](https://www.npmjs.com/) installed.

## API document

Read [API document](./API.md) for the details of REST API.

## FAQ

> Q: What is the default username and password?
>
> A: Default username and password is configured in
>  - `DEFAULT_PAI_ADMIN_USERNAME` and `DEFAULT_PAI_ADMIN_PASSWORD` environment variables
>    if service is deployed manually.
>  - `restserver.default-pai-admin-username` and `restserver.default-pai-admin-password` field
>    in [service configuration file][service-configuration]
>    if service is deployed by [pai management tool][pai-management].

> Q: Why can't I login with default username and password?
>
> A: If there is already a `/users` directory in etcd, REST Server will not auto generate
>    the default user, even it is empty and without any users. To regenerate default user,
>    try [delete the whole `/users` directory](https://coreos.com/etcd/docs/latest/v2/api.html#deleting-a-directory)
>    and restart REST Server, a new default user will be generated.


[pai-management]: ../pai-management
[service-configuration]: ../../examples/cluster-configuration/services-configuration.yaml
