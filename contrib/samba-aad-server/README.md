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
./start.sh <DOMAIN> <DOMAINUSER> <DOMAINPWD> <PAISMBUSER> <PAISMBPWD>
```
DOMAIN: Domain to join, should be EUROPE|FAREAST|NORTHAMERICA|MIDDLEEAST|REDMOND|SOUTHAMERICA|SOUTHPACIFIC|AFRICA
DOMAINUSER: Existing domain user name. Will join domain using this account.
DOMAINPWD: Password for domain user.
PAISMBUSER: Create new local samba account for PAI to use.
PAISMBPWD: Password for new samba account.

- Access samba in domain-joined windows system
```
\\<server address>
```
This will show two folders: data and home. Data folder is a shared folder for all users, and home folder is private folder for current AD user.

- Mount samba using personal account
```
mount -t cifs //<server address>/<folder> <mount point> -o username=<domain user name>,password=<domain user password>,domain=<domain>
```

- Mount samba using PAI account
```
mount -t cifs //<server address>/<folder> <mount point> -o username=<pai smb user>,password=<pai smb password>,domain=local
```

- Query user groups
```
http://<server address>:<server port>/GetUserId?userName=<domain user name>
```