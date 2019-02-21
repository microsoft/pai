# OpenPAI Marketplace

OpenPAI marketplace is built to find and share OpenPAI protocol jobs and their prerequisite assets in the a community.
OpenPAI marketplace includes [marketplace repository](#marketplace-repository) and [service](#marketplace-service).


## Contents

* [Objective](#objective)
* [Features](#features)
* [Concepts](#concepts)
    * [Marketplace Repository](#marketplace-repository)
    * [Marketplace Service](#marketplace-service)
* [Reference](#reference)


## Objective

An AI researcher reads a new paper and wants to reproduce the results in the paper, he finds a GitHub link in the paper then go to GitHub and downloads the code. To run code successfully, he needs to read the HOWTO docs, download dataset from somewhere else, prepare the enivornment for the code, then run the code with parameters mentioned in the paper and wait for results. He may not get the right results in the first try because one parameter is missed in the paper.
Once he gets the same results, he thinks the method proposed in the paper is great and wants to train the neural network on another dataset. Then he has to download another dataset, modify the code to meet the dataset's requirements and run again.
Another AI engineer gets real world data and wants to train a state-of-the-art model on the data. He needs to search on Google/arXiv/GitHub to find a suitable neural network at first. What the AI research does cannot be reused by him at all.

To find and share reproducible AI jobs easilier, we introduce OpenPAI marketplace, a ecosystem for companies and communities to open source their AI jobs and assets.

With OpenPAI marketplace, everyone can find, share and use OpenPAI protocol jobs easily. The AI researcher can publish job in his paper with prerequisite data, scripts and docker image. All parameters he used can be specified in job's protocol file. If another researcher wants to try the same job or change another dataset, just use the same protocol file or change data prerequisite. Engineers who want to train state-of-the-art models can also search related jobs through keyword in marketplace easily. They can also share their new job protocol files in marketplace for others.


## Features

* Protocol File Validation

    Marketplace supports to validate whether a new YAML file meets the OpenPAI protocol.

* Protocol File Management

    Marketplace supports to manage and orgnize the given protocol files on file system.

* Content Based Search

    Marketplace supports content based search among any aspect in selected components for all protocol files.

* Version Control

    Marketplace supports version control for all protocol files.

* User and Group

    Marketplace supports access control in user and group level. Each protocol file belongs to a certain user and one user belongs to multiple groups.

* Authentication

    Marketplace supports authentication, write operations need authetication, read operations need (private marketpalce) or needn't (public marketplace) authentication.

* RESTful API and Webpage

    Marketplace provides RESTful API and webpage for interaction.


## Concepts

### Marketplace Repository

Marketplace repository is a directory on file system, which contains other reposirory and __valid__ protocol files.
The structure of a repository can be defined by users, through component type, usage, or anything else.

The repository supports file operation for protocol files or directories, and content based search among any aspect in selected components.

The root directory of a marketplace repository contains a dot directory, which records configuration or information of the repository, and indicates that it is a marketplace repository. Configuration and information contain the repository's protocol files list (to track all files), components content index (to search content easily), information may be needed in the future like version and access details.

### Marketplace Service

Marketplace service is a web service serving a marketplace repository.

Through the service, users can interact with the repository remotely, search, download or update their protocol files inside the repository.
Marketplace could be visited through command line tool or web interface, it can also be integrated into OpenPAI's webportal as a plugin.


## Reference

* [OpenPAI protocol](./protocol.md).
