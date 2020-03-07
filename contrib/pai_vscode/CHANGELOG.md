# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2019-01

### Added

- Open job pages and dashboard pages in VS Code
- Submit job to PAI cluster from VS Code
- Open PAI's hdfs as a workspace folder

## [0.2.0] - 2019-03

### Added

- Generate jsonc job config by default
- Add a PAI view container (sidebar), includes
  - Job list view
    - Auto refresh enabled
  - HDFS explorer
    - You can choose where hdfs explorer will be shown (view container or workspace folder)

## [0.2.1] - 2019-06

### Added

- Generate YAML job config file for Protocol V2
  - Submit YAML job file
  - Snippets and autocomplete for YAML job config

## [0.2.2] - 2019-11

### Added

- Support AAD login to OpenPAI cluster
  - User can use access token instead of password in cluster config file.

## [0.2.3] - 2019-12

### Added

- Add local simulation for YAML job config file
- Add https in cluster config
  - User can use https connect to OpenPAI cluster

## [0.3.0] - 2020-03

### Added

- Add storage explorer
  - User can use storage explorer to manage data in OpenPAI teamwise storage
  - User can add personal storage to storage explorer
- Add auto upload feature to teamwise storage and personal storage
- New job list auto refresh rule
  - Job list auto refresh will be trigger only when the `PAI JOB LIST` view is visible.
- Add notification to website after AAD login success
