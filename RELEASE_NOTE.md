# Release v0.12.0

## New Features

## Improvements

### Service

* Web portal:
  - Display error message in job detail page
  - Import users from CSV file directly and show the final results (#2495)
  - Add TotalGpuCount and TotalTaskCount into job list (#2499)
  - Replace the suffix if a cloned job is resubmited (#2451)
  - Refine view full log (#2431)
  - Display task state in job detail page (#2459)
  - Job list: optimize filter (#2444)
  - Replace the url module with the querystring module (#1825)
  
* REST server:
  - Follow REST protocol in job create controller (#2481)
  - Add task state; Add job's retry details; Refine job config (#2306)
  - Remove error message (#2464)

* Framework Launcher:
  - Add more info into SummarizedFrameworkInfo (#2435)
  
* Alart manager:
  - Send resolved email and make user can config repeat interval (#2438)
  - Monitor process memory consumption and alert for om[is]agent (#2419)

### Deployment

- Add cluster version info (#2528)
- Check if the nodes are ubuntu 16.04 (#2520)
- Check duplicate hostname (#2403)

### Documentation

- Doc refactoring and update hello-world sample (#2445)
- Add Chinese translation (#2344)

### Example

- Fix driver parse (#2458)

## Notable Fixes

* Web portal:
  - Support IE 11
  - Add validation when submitting job by json (#2375)
  - Job List-filter UI fix (#2479)
  - Fix job detail "jobConfig is null" bug (#2500)
  - Fix job detail page's "retry link" (#2478)
  - Fix job v2 detail page rendering error (#2480)
  
* REST server:
  - code_dir_size report incorrect error message (#2388)
  - fix script entrypoint (#2522)
  - Fixed jq invocation errors with numeric taskRoles (#2405)

* Hadoop:
  - Remove duplicate diagnostics (#2527)

* Alart manager:
  - Fix alert label error (#2521)

* Drivers:
  - Add an optional configuration to skip ib drivers installation. (#2514)
  - Fix delete script of rollback nvidia runtime (#2370)

* Storage plugin
  - Add environment and handle corner cases (#2525)

## Known Issues

## Upgrading from Earlier Release

Please follow the [Upgrading to v0.11](./docs/upgrade/upgrade_to_v0.11.md) for detailed instructions.
