
  

##  Management in basic authentication mode Guide

  
In the old version of Openpai,when deployed in basic authentication mode,pai
didn't provide explicit group information for the admins,thus raising  confusion when managing the platform. In latest version ,pai will provide direct group management .

This document will introduce how to manage user ,group and teamwise storage in Openpai basic authentication mode in the latest version(0.16.0).

  


  
### User Management
#### Create a new user

  

To add a new user to the cluster,cluster admins needs to do:

  

- create user using webportal or using [rest apis](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#tag/user)
- users' username and password must be given when creating a user. 

  

#### Update existing user

  

In basic authentication mode,admin can update the existing users' information directly.

  

- User name ,password and email can be changed in webportal or using [rest apis](https://github.com/microsoft/pai/blob/master/docs/rest-server/API.md).

  


- Admin can also update users' grouplist in webportal .A user can belong to  more than one group in basic authentication mode.Admin can add a group or remove a group from users' grouplist.
#### Delete a user
- delete user using webportal or using [rest apis](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#tag/user)
  

### Group management

  

In basic authentication mode,a group named 'default'  and a group named 'admingroup' is created when deploy PAI. Every user needs to be in a group to have access to VCs and teamwise storages.
  It is possible to create a user without assigning any  group to it.This user will be assigned to group default. Groups that is admin  have access to all the VCs.

#### Create a new group

In basic authentication mode,group is bind to virtual cluster.Admin can not create group directly in this mode. To create a new group,admin needs to do:
-  Create a new group by using rest apis or webportal.
#### Update a group
- Update teamwise storages,using command line tool or webportal to update storage configs in the group.
- Update VCs. Using webportal or rest api to change the VCs that this group have access to.
- Update adminrole. Using webportal or rest apis to update group's adminrole information,only users in admin group have access to administration.
#### Delete a group
- Use webportal or rest apis to remove a group from a cluster,the users in this group will be updated.

### Storage management
  
To use teamwise storage ,admin needs to do these things:

  

1. Config storagemanager,follow [the guide on storagemanager](https://github.com/microsoft/pai/tree/master/src/storage-manager)

  

2. Use storage cmd line tool,like shown in [storage plugin](https://github.com/microsoft/pai/blob/master/contrib/storage_plugin/README.MD)  to create storage config and add it to groups.
  




  
  
  





