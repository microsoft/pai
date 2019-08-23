# Samba server with AAD integration

A samba server integrated with AAD. Has a shared path and private paths for AD users, and create a shared account.  
Also, it offers api to query user groups by user name.  
This is an example of samba server with AAD integration, please change to your own configuration before use.

## Index

- [Components](#Components)
- [How to Use](#How_to_Use)

### Components <a name="Components"></a>

- Samba server Data Structure: 

    root 
        -- data
        -- users 
            -- user1
            -- user2
            -- user3                 
    

data: Shared folder.  
user: User private folder, user folder will be created when user first use samba.

- Nginx service A service that can query user groups through domain user name. 

### How to Use <a name="How_to_Use"></a>

- Replace with your own configs krb5.conf: Replace realms. smb.conf: Replace realm and id map. domaininfo.py: Replace corp domains.

- Build docker image

    ./build.sh
    

- Start service 

    ./start.sh <DOMAIN> <DOMAINUSER> <DOMAINPWD> <PAISMBUSER> <PAISMBPWD>
    

| Variable   |                              Spec                              |
| ---------- |:--------------------------------------------------------------:|
| DOMAIN     |                  Domain to join, e.g. FAREAST                  |
| DOMAINUSER | Existing domain user name. Will join domain using this account |
| DOMAINPWD  |                    Password for domain user                    |
| PAISMBUSER |         Create new local samba account for PAI to use          |
| PAISMBPWD  |                 Password for new samba account                 |


- Access samba with domain-joined windows system.  
    In windows file explorer, input: 

    \\<server address>
    

This will show two folders: data and home.  
Data folder is a shared folder for all users.  
Home folder is private folder for current AD user.

- Mount samba using personal account

    mount -t cifs //<server address>/<folder> <mount point> -o username=<domain user name>,password=<domain user password>,domain=<domain>
    

- Mount samba using PAI account

    mount -t cifs //<server address>/<folder> <mount point> -o username=<pai smb user>,password=<pai smb password>,domain=WORKGROUP
    

- Query user groups

    http://<server address>:<server port>/GetUserId?userName=<domain user name>