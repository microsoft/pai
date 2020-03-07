## Management in basic authentication mode Guide


In the old version of OpenPAI, when deployed in basic authentication mode, pai didn't provide explicit group information for the admins, thus raising confusion when managing the platform. In latest version(>=0.16.0), pai will provide direct group management.

This document will introduce how to manage user, group and teamwise storage in OpenPAI basic authentication mode in the latest version(>=0.16.0).

### User Management
#### Create a new user

To add a new user to the cluster, cluster admin needs to do:

- create user using [create user api](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/createUser)
- users' username and password must be given when creating a user. 

#### Update existing user


In basic authentication mode, admin can update the existing users' information directly.


- User name, password and email can be changed by using [user apis](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#tag/user).
- User's grouplist can be updated by using [user group apis](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/updateUserGrouplist). Only admins can update users' group information.


#### Delete a user
- delete user using [delete user api](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/deleteUser)


### Group management


In basic authentication mode, a group named `default` and a group named `admingroup` will be created when deploy OpenPAI. Every user needs to be in a group to have access to VCs and teamwise storages.
When creating a user without assigning any group to it. The user will be assigned to group `default`.
For the `admingroup`, it has the permission to access all VCs and teamwise storages.

#### Create a new group

In basic authentication mode, group is bind to virtual cluster. Admin can not create group directly in this mode. To create a new group, admin needs to do:
- Create a new group by using [create group api](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/createGroup).

#### Update a group

- Update teamwise storages, using [command line tool](https://github.com/microsoft/pai/blob/master/contrib/storage_plugin/README.MD) to update storage configs in the group.
- Update VCs. Using [virtual cluster api](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#tag/virtual-cluster) to change the VCs that this group have access to.
- Update adminrole. Using [group extension update api](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/updateGroupExtensionAttribution) to update group's adminrole information,only users in admin group have access to administration.

#### Delete a group

- Use [delete group api](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/deleteGroup) to remove a group from a cluster, the users in this group will be updated.


### Storage management


To use teamwise storage, admin needs to do these things:


1. Config storagemanager, follow [the guide on storagemanager](https://github.com/microsoft/pai/tree/master/src/storage-manager)


2. Use storage cmd line tool, like shown in [storage plugin](https://github.com/microsoft/pai/blob/master/contrib/storage_plugin/README.MD) to create storage config and add it to groups.
