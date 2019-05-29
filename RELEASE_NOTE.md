# Release v0.13.0


## New Features

* PAI protocol:
  - Introduce PAI protocol and job submission v2 ([#2260](https://github.com/microsoft/pai/pull/2260))
  - Add new job submission v2 plugin ([#2461](https://github.com/microsoft/pai/pull/2461))
  - Add new marketplace plugin, support GitHub and Azure DevOps repository ([#2703](https://github.com/microsoft/pai/pull/2703), [#2724](https://github.com/microsoft/pai/pull/2724))

* Web portal:
  - Add new home page ([#2544](https://github.com/microsoft/pai/pull/2544), [#2614](https://github.com/microsoft/pai/pull/2614))
  - Add new user management page ([#2726](https://github.com/microsoft/pai/pull/2726), [#2796](https://github.com/microsoft/pai/pull/2796))


## Improvements

* PAI protocol:
  - Update example jobs in marketplace v2 for PAI protocol ([#2827](https://github.com/microsoft/pai/pull/2827))

* Web portal:
  - Refine styles in job pages ([#2829](https://github.com/microsoft/pai/pull/2829))
  - Refine alert message in job pages ([#2698](https://github.com/microsoft/pai/pull/2698))
  - Reduce build bundle size ([#2715](https://github.com/microsoft/pai/pull/2715))

* Rest server:
  - Add job v1 config to v2 converter ([#2756](https://github.com/microsoft/pai/pull/2756))
  - Check default runtime before starting Docker ([#2754](https://github.com/microsoft/pai/pull/2754))

* Framework launcher:
  - Upgrade to Hadoop 2.9.0 ([#2704](https://github.com/microsoft/pai/pull/2704))

* Job exporter:
  - Change triggering rule for exporter hangs ([#2766](https://github.com/microsoft/pai/pull/2766))
  - Add GPU temperature detection ([#2757](https://github.com/microsoft/pai/pull/2757))

* Watchdog:
  - Use `/api/v1/pods` to get all pods ([#2750](https://github.com/microsoft/pai/pull/2750))

* Deployement:
  - Allow user to use <kbd>Backspace<\kbd> in `paictl` input ([#2769](https://github.com/microsoft/pai/pull/2769))
  - Disable InfiniBand driver installation by default ([#2595](https://github.com/microsoft/pai/pull/2595))


## Documentation

* Refine document of VS Code extension ([#2707](https://github.com/microsoft/pai/pull/2707))
* Add document for PAI storage ([#2822](https://github.com/microsoft/pai/pull/2822))
* PAI protocol specification document ([#2260](https://github.com/microsoft/pai/pull/2260))
* Job submission v2 and marketplace plugins document ([#2820](https://github.com/microsoft/pai/pull/2820))
* Update RESTful API document for API v2 ([#2816](https://github.com/microsoft/pai/pull/2816))
* Fix typos in document ([#2818](https://github.com/microsoft/pai/pull/2818))


## Bug Fixes

TODO


## Known Issues

* Deployments issues on NVIDIA DGX2 ([#2742](https://github.com/microsoft/pai/pull/2742))
