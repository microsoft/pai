# OpenPAI Protocol

OpenPAI protocol is designed to components of AI jobs and assets for exchange.


## Contents

* [Objective](#objective)
* [Features](#features)
* [Concepts](#concepts)
    * [Protocol](#protocol)
    * [Protocol file](#protocol-file)
* [Reference](#reference)


## Objective

Modern life is saturated with data, and new technologies like AI are booming nearly every day -- but how can we use those innovations to make a real difference to the world? This has always been a pain to data scientist and industry players: Data scientists would like to turn their break-through neural model into production, but they need real industry data; Industry players might have the data but don't know how to find a matched model and how to deploy the model into production. Even the data scientists meet the right industry partners to collaborate, the diversified AI platform might stop them here and there.

To make AI jobs and assets to be exchanged and reproduced easilier among different clusters or platforms, we design OpenPAI protocol to specify every component and aspect of an AI job. The protocol will help to exchange, reproduce AI jobs and reuse AI assets across projects regardless the cluster or platform specifications.


## Features

* Easy to Share

    The protocol contains different types of components of AI jobs. User can choose one or more components of one certain job to share or reuse.

* Easy to Reproduce

    The protocol contains all required or optional aspects of AI jobs, along with detailed desciptions, which are enough to reproduce other users' experiments.

* Easy to Use

    The protocol splits cluster or platform specifications into a separate "_deployments_" section. Platform operators can help to deploy even if the cluster is not running PAI as long as it supports OpenPAI protocol.


## Concepts

### Protocol

OpenPAI protocol is a set of schema which defines all required or optional aspects of an AI job running on OpenPAI clusters or other platforms which support OpenPAI protocol. It has five types of components: _JOB_, _DATA_, _SCRIPT_, _DOCKERIMAGE_, and _OUTPUT_. The _JOB_ type may require other types which are prerequisite assets for an AI job.

### Protocol File

OpenPAI protocol for a specific job can be ritten as a YAML file, which is called protocol file. A protocol file is valid if and only if it meets the schema in OpenPAI protocol.


## Reference

* [Definition and example for OpenPAI protocol](./pai-protocol.yaml).
