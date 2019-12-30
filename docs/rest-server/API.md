# Quick Start

## 1. Job config file

Prepare a job config file as described [here](../user/training.md), for example, `exampleJob.json`.

## 2. Authentication

### a. Basic Mode, user account and password

HTTP POST your username and password to get an access token from:

```bash
http://restserver/api/v1/token
```

For example, with [curl](https://curl.haxx.se/), you can execute below command line:

```sh
curl -H "Content-Type: application/x-www-form-urlencoded" \
      -X POST http://restserver/api/v1/token \
      -d "username=YOUR_USERNAME" -d "password=YOUR_PASSWORD"
```

### b. Azure AD - OIDC mode

#### I. Login - get AuthCode

HTTP GET the redirect URL of Azure AD for authentication:

```url
http://restserver/api/v1/authn/oidc/login
```

#### II. Login - get token with AuthCode

HTTP POST the token from AAD (AccessToken, IDToken, RefreshToken) to get OpenPAI's access token. Web-browser will call this API automatically after the step I.

```url
HTTP://restserver/api/v1/authn/oidc/return
```

#### III. Logout

HTTP GET the redirect URL of Azure AD to sign out the authentication:

```url
http://restserver/api/v1/authn/oidc/logout
```

## 3. Submit a job

HTTP POST the config file as json with access token in header to:

```bash
http://restserver/api/v1/user/:username/jobs
```

For example, you can execute below command line:

```sh
curl -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
      -X POST http://restserver/api/v1/user/:username/jobs \
      -d @exampleJob.json
```

## 4. Monitor the job

Check the list of jobs at:

```
http://restserver/api/v1/jobs
```

or
```
http://restserver/api/v1/user/:username/jobs
```

Check your exampleJob status at:

```
http://restserver/api/v1/user/:username/jobs/exampleJob
```

Get the job config JSON content:

```
http://restserver/api/v1/user/:username/jobs/exampleJob/config
```

Get the job's SSH info:

```
http://restserver/api/v1/user/:username/jobs/exampleJob/ssh
```

# RestAPI

## Root URI

Configure the rest server port in [services-configuration.yaml](../../examples/cluster-configuration/services-configuration.yaml).

## API Details

Please visit [ReDoc](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml) to view RESTful API details.


## About legacy jobs

Since [Framework ACL](../../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#Framework_ACL) is enabled since this version,
jobs will have a namespace with job-creater's username. However there were still some jobs created before
the version upgrade, which has no namespaces. They are called "legacy jobs", which can be retrieved, stopped,
but cannot be created. To figure out them, there is a "legacy: true" field of them in list apis.

In the next versions, all operations of legacy jobs may be disabled, so please re-create them as namespaced
job as soon as possible.
