OpenPAI Marketplace
===================

OpenPAI marketplace is a service for finding and sharing your PAI job or the job's prerequisite assets.
It will provide the following features:

1. Protocol
2. Repository
3. Marketplace


Protocol
--------

OpenPAI protocol is a set of schema which defines all required or optional aspects of an OpenPAI job. It has five types of components: _JOB_, _DATA_, _SCRIPT_, _DOCKERIMAGE_, and _OUTPUT_. The _JOB_ type may require other types which are prerequisite assets for an AI job.

The protocol for a specific job can be written as a YAML file, which is called protocol file. A protocol file is valid if and only if it meets the schema in protocol.

To implement the protocol, we need to define the schema for job and validate a YAML file for the pre-defined schema.


Repository
----------

OpenPAI repository is a directory on file system, which contains other reposirory and __valid__ protocol files.
The structure of a repository can be defined by users, through component type, usage, or anything else.

The repository supports file operation for protocol files or directories, and content based search among any aspect in selected components.

The root directory of a repository should contain a dot file or dot directory, which records configuration or information of the repository, and indicates that it is a repository. Possible configuration and information could be the repository's protocol files list (to track all files), components content index (to search content easily), information may be needed in the future like version and access details.

To implement the repository, we need to initialize the dot file or directory and update it everytime the repository is accessed.


Marketplace
-----------

OpenPAI marketplace is a web service serving a repository.

Through the service, users can interact with the repository remotely, search, download or update their protocol files inside the repository.
Marketplace could be visited through command line tool or web interface, it can also be integrated into OpenPAI's webportal as a plugin.

To implement the marketplace, we need to host the repository and handle remote requests for searching, downloading or updating.
We also need to add a plugin in webportal.


Future Work
-----------

1. Version Control
2. User and Group
3. Authentication and Authorization

