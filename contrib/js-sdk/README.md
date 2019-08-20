# OpenPAI JS SDK

The `Javascript` SDK for `OpenPAI`.

## Installation

```bash
npm install --save npm install yiyione/pai#openpai-js-sdk
```

## Restful APIs

Initialize the `openPAIClient`

```ts
const cluster: IPAICluster = {
    username: '<username>',
    password: '<password>',
    rest_server_uri: '<The host>/rest-server'
};
const openPAIClient = new OpenPAIClient(cluster);
```

### Job related

- [x] List jobs (GET /api/v1/jobs)

    ```ts
    list = await openPAIClient.job.list();
    list = await openPAIClient.job.list('username=xxx');
    ```

- [x] Get job (GET /api/v2/user/{username}/jobs/{jobname})

    ```ts
    job = await openPAIClient.job.get(username, jobname);
    ```

- [x] Get framework info (GET /api/v2/jobs/{username}~{jobname})

    ```ts
    info = await openPAIClient.job.getFrameworkInfo(username, jobname);
    ```

- [x] Get job config (GET /api/v2/jobs/{username}~{jobname}/config)

    ```ts
    config = await openPAIClient.job.getConfig(username, jobname);
    ```

- [x] Get job ssh info (GET /api/v1/user/{username}/jobs/{jobname}/ssh)

    ```ts
    sshInfo = await openPAIClient.job.getSshInfo(username, jobname);
    ```

- [x] Submit v1 job (POST /api/v1/user/{username}/jobs)

    ```ts
    await openPAIClient.job.submitV1((userName, config)
    ```

- [x] Submit v2 job (POST /api/v2/jobs)

    ```ts
    await openPAIClient.job.submit(config);
    ```

- [x] Remove job (DELETE /api/v2/user/{username}/jobs/{jobname})

    ```ts
    await openPAIClient.job.delete(username, jobname);
    ```

- [x] Start/Stop job (PUT /api/v2/user/{username}/jobs/{jobname}/executionType)

    ```ts
    await openPAIClient.job.execute(username, jobname, 'START');
    await openPAIClient.job.execute(username, jobname, 'STOP');
    ```

### User related

- [x] Get user (GET /api/v2/user/{username})

    ```ts
    user = await openPAIClient.user.get(username);
    ```

- [x] List users (GET /api/v2/user/)

    ```ts
    list = await openPAIClient.user.list();
    ```

- [x] Create user (POST /api/v2/user/)

    ```ts
    await openPAIClient.user.create(username, password, admin, email, virtualClusters);
    ```

- [x] Delete user (DELETE /api/v2/user/{username})

    ```ts
    await openPAIClient.user.delete(username);
    ```

- [x] Update user extension (PUT /api/v2/user/{username}/extension)

    ```ts
    await openPAIClient.user.updateExtension(username, {
        "extension-key1": "extension-value1",
        "extension-key2": "extension-value2",
        ...
    });
    ```

- [x] Update user virtual cluster (PUT /api/v2/user/{username}/virtualcluster)

    ```ts
    await openPAIClient.user.updateVirtualcluster(username, ['vc1', 'vc2', ...]);
    ```

- [x] Update user password (PUT /api/v2/user/{username}/password)

    ```ts
    await openPAIClient.user.updatePassword(username, oldPassword, newPassword);
    ```

- [x] Update user email (PUT /api/v2/user/{username}/email)

    ```ts
    await openPAIClient.user.updateEmail(username, newEmail);
    ```

- [x] Update user admin permission (PUT /api/v2/user/{username}/admin)

    ```ts
    await openPAIClient.user.updateAdminPermission(username, newAdminPermission);
    ```

- [x] Update user group list (PUT /api/v2/user/{username}/grouplist)

    ```ts
    await openPAIClient.user.updateGroupList(username, ['group1', 'group2', ...]);
    ```

- [x] Add group into user group list (PUT /api/v2/user/{username}/group)

    ```ts
    await openPAIClient.user.addGroup(username, groupName);
    ```

- [x] Remove group from user group list (DELETE /api/v2/user/{username}/group)

    ```ts
    await openPAIClient.user.removeGroup(username, groupName);
    ```

### VC related

- [x] List all virtual clusters (GET /api/v2/virtual-clusters)

    ```ts
    list = await openPAIClient.virtualCluster.list();
    ```

- [x] Get node resource (GET /api/v2/virtual-clusters/nodeResource)

    ```ts
    resource = await openPAIClient.virtualCluster.getNodeResource();
    ```

- [x] Get virtual cluster (GET /api/v2/virtual-clusters/{vcName})

    ```ts
    vc = await openPAIClient.virtualCluster.get(vcName);
    ```

- [x] Create or update virtual cluster (PUT /api/v1/virtual-clusters/{vcName})

    ```ts
    await openPAIClient.virtualCluster.createOrUpdate(vcName, vcCapacity, vcMaxCapacity);
    ```

- [x] Remove virtual cluster (DELETE /api/v1/virtual-clusters/{vcName})

    ```ts
    await openPAIClient.virtualCluster.delete(vcName);
    ```

- [x] Change virtual cluster status (PUT /api/v1/virtual-clusters/{vcName}/status)

    ```ts
    await openPAIClient.virtualCluster.changeStatus(vcName, newStatus);
    ```

- [ ] Get virtual cluster available resourceUnit (GET /api/v2/virtual-clusters/{vcName}/resourceUnits)

    ```json
    {
        "code":"NotImplementedError",
        "message":"getResourceUnits not implemented in yarn"
    }
    ```

### Auth related

- [x] Get token (POST /api/v1/token)

    ```ts
    token = await openPAIClient.token();
    ```

- [x] Get auth info (GET /api/v1/authn/info)

    ```ts
    info = await openPAIClient.authn.info();
    ```

- [x] Basic login (POST /api/v1/authn/basic/login)

    ```ts
    loginInfo = await openPAIClient.authn.login();
    ```

- [x] OIDC login (GET /api/v1/authn/oidc/login)

    ```ts
    redirect = await openPAIClient.authn.oidcLogin();
    ```

- [x] OIDC logout (GET /api/v1/authn/oidc/logout)

    ```ts
    redirect = await openPAIClient.authn.oidcLogout();
    ```

- [ ] OIDC return (GET/POST /api/v1/authn/oidc/return)

    ```text
    Web-browser will call this API automatically after OIDC login step.
    ```

### Group related

- [ ] Create a group (POST /api/v2/group)
- [ ] Change a group's extension
      (POST /api/v2/group/:groupname/extension)
- [ ] Change a specific attribute in a nested group extension
      (PUT /api/v2/group/:groupname/extension/path/to/attr)
- [ ] Change a group's description
      (POST /api/v2/group/:groupname/description)
- [ ] Change a group's externalname, and bind it with another external group
      (POST /api/v2/group/:groupname/externalname)
- [ ] Delete a group from system (DELETE /api/v2/group/:groupname)

## Useful tools

- [ ] To be added...
