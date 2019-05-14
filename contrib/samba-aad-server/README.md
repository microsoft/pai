# Samba server with AAD integration

A samba server integrated with AAD. 

## Index
- [Components](#Components)
- [How to Use](#How_to_Use)

### Components <a name="Components"></a>
- Samba server
Data Structure:
```
root 
    -- data
    -- users 
	     -- user1
         -- user2
         -- user3                 
```
data: Shared folder.
user: User private folder, user folder will be created when user first use samba.

- Nginx service
A service that can query user groups through domain user name.


### How to Use <a name="How_to_Use"></a>
- Build docker image
```
./build.sh
```

- Start service 
```
./start.sh <DOMAINUSER> <DOMAINPWD> <PAISMBUSER> <PAISMBPWD>
```
DOMAINUSER: Existing domain user name, the format is "domain\\username"(if use the default domain FAREAST, then the format is "username"). Will join domain with this account.
DOMAINPWD: Password for domain user.
PAISMBUSER: Create new local samba account for PAI to use.
PAISMBPWD: Password for new samba account.

- Access samba in domain-joined windows system
```
\\<server address>
```
This will show two folders: data and home. Data folder is a shared folder for all users, and home folder is private folder for current AD user.

- Mount samba to local
```
mount -t cifs //<server address>/<folder> <mount point> -o username=<domain user name>,password=<domain user password>,domain=<domain>
```

- Mount samba in PAI
```
mount -t cifs //<server address>/<folder> <mount point> -o username=<pai smb user>,password=<pai smb password>
```

- Query user groups
```
http://<server address>:<server port>/GetUserId?userName=<domain user name>
```