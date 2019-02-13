OpenPAI Protocol Sharing
========================

Design for OpenPAI protocol sharing and publishing.


Workflow
--------

There are mainly two parts in the protocol sharing and publishing workflow: the local protocol repository and the remote marketplace. Here's how it works:

1. User creates a project, writes a protocol file `mnist.yaml` and submits a PAI job.
2. User wants to share and publish his job, he can add the protocol file to a local repository named `pai_experiments`.
3. User can push the changes in the local repository to a remote marketplace, other users can see the new protocol file and pull it on their local machine.
They can modify any public protocol file and re-publish to the marketplace.
Marketplace supports authentication, write operations need authetication, read operations need (private marketpalce) or needn't (public marketplace) authentication.

```

+---------------+        +-------------------------------+        +----------------------------------+          +---------------------+
|               |        |                               |  push  |                                  |  export  |                     |
|    Project    |  add   |  OpenPAI Protocol Repository  +------->+       OpenPAI Marketplace        +--------->+  External Services  |
|               +------->+            (local)            |        |           (remote)               |          |      (remote)       |
|   mnist.yaml  |        |        pai_experiments        +<-------+ user@paip://openp.ai/marketplace +<---------+       GitHub        |
|               |        |                               |  pull  |                                  |  import  |                     |
+---------------+        +-------------------------------+        +----------------------------------+          +---------------------+

```


OpenPAI Protocol Repository
---------------------------

The protocol repository can be implemented like a git repository, any protocol repository should contain directories or valid protocol yaml files.
Here are some key features for protocol repository:

* protocol file validation
    * `$ paip add [file/dir list]`

* pushing/pulling __selected__ files
    * `$ paip push [file/dir list]`
    * `$ paip pull [file/dir list]`

* version control for __individual__ protocol file
    * `$ paip commit [message] [file/dir list]`
    * `$ paip checkout [commit hash] [file/dir list]`

* submodule
    * `$ paip submodule add [marketplace url/name]`

* communication with multiple remote marketplace
    * `$ paip marketplace add [name] [marketplace url]`

* openpai job submission
    * `$ paip run [file]`


OpenPAI Marketplace
-------------------

The marketplace can be implemented as a http server, it is actually a protocol repository on file system and a http server will serve it.
Here are some key features for protocol marketplace:

* web interface and restful api for interaction
    * `$ paip serve [protocol repo]`

* sending/receiving protocol file or directory
    * `PUT /repo/protocol/:file`
    * `GET /repo/protocol/:file`

* user authentication and management
    * `PUT /repo/user/:user`
    * `POST /repo/auth/:user`
    * `$ paip login [marketplace url/name]`

* keyword search
    * `GET /repo/search/:keywords`
    * `$ paip search [marketplace url/name] [keywords]`

* importing/exporting all protocol files to public services, like GitHub
    * `$ paip import [git url] [protocol repo]`
    * `$ paip export [git url] [protocol repo]`
