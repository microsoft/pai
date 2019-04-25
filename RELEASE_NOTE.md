# Release v0.12.0

## New Features
* Web portal:
  - Display error message in job detail page [#2456](https://github.com/Microsoft/pai/issues/2456)
  - Import users from CSV file directly and show the final results [#2495](https://github.com/Microsoft/pai/pull/2495)
  - Add TotalGpuCount and TotalTaskCount into job list [#2499](https://github.com/Microsoft/pai/pull/2499)

* Deployment
  - Add cluster version info [#2528](https://github.com/Microsoft/pai/pull/2528)
  - Check if the nodes are ubuntu 16.04 [#2520](https://github.com/Microsoft/pai/pull/2520)
  - Check duplicate hostname [#2403](https://github.com/Microsoft/pai/pull/2403)
  
## Improvements
* Web portal:
  - Replace the suffix if a cloned job is resubmited [#2451](https://github.com/Microsoft/pai/pull/2451)
  - Refine view full log [#2431](https://github.com/Microsoft/pai/pull/2431)
  - Job list: optimize filter [#2444](https://github.com/Microsoft/pai/pull/2444)
  - Replace the url module with the querystring module [#1825](https://github.com/Microsoft/pai/pull/1825)
* REST server:
  - Follow REST protocol in job create controller [#2481](https://github.com/Microsoft/pai/pull/2481)
  - Add task state; Add job's retry details; Refine job config [#2306](https://github.com/Microsoft/pai/pull/2306)
  - Remove error message [#2464](https://github.com/Microsoft/pai/pull/2464)
* Framework Launcher:
  - Add more info into SummarizedFrameworkInfo [#2435](https://github.com/Microsoft/pai/pull/2435)
* Alert manager:
  - Send resolved email and make user can config repeat interval [#2438](https://github.com/Microsoft/pai/pull/2438)
  - Monitor process memory consumption and alert for `omiagent` and `omsagent` [#2419](https://github.com/Microsoft/pai/pull/2419)
  
## Documentation
- Doc refactoring and update hello-world sample [#2445](https://github.com/Microsoft/pai/pull/2445)
- Add Chinese translation [#2344](https://github.com/Microsoft/pai/pull/2344)

## Bug Fixes
* Web portal:
  - Add validation when submitting job by json [#2375](https://github.com/Microsoft/pai/issues/2375)
  - Job List-filter UI fix [#2479](https://github.com/Microsoft/pai/issues/2479)
  - Fix job detail "jobConfig is null" bug [#2500](https://github.com/Microsoft/pai/pull/2500)
  - Fix job detail page's "retry link" [#2478](https://github.com/Microsoft/pai/pull/2478)
  - Fix job v2 detail page rendering error [#2480](https://github.com/Microsoft/pai/pull/2480)
  
* REST server:
  - code_dir_size report incorrect error message [#2388](https://github.com/Microsoft/pai/pull/2388)
  - fix script entrypoint [#2522](https://github.com/Microsoft/pai/pull/2522)
  - Fixed jq invocation errors with numeric taskRoles [#2405](https://github.com/Microsoft/pai/pull/2405)

* Hadoop:
  - Remove duplicate diagnostics [#2527](https://github.com/Microsoft/pai/pull/2527)

* Alart manager:
  - Fix alert label error [#2521](https://github.com/Microsoft/pai/pull/2521)

* Drivers:
  - Add an optional configuration to skip ib drivers installation. [#2514](https://github.com/Microsoft/pai/pull/2514)
  - Fix delete script of rollback nvidia runtime [#2370](https://github.com/Microsoft/pai/pull/2370)
  - Fix driver parse [#2458](https://github.com/Microsoft/pai/pull/2458)

* Storage plugin
  - Add environment and handle corner cases [#2525](https://github.com/Microsoft/pai/pull/2525)

## Known Issues
N/A

## Upgrading from Earlier Release
Please follow the [Upgrading to v0.12](./docs/upgrade/upgrade_to_v0.12.md) for detailed instructions.
