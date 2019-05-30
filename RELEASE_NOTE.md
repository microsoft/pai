# Release v0.13.0


## New Features

* OpenPAI protocol:
  - Introduce [OpenPAI protocol](./docs/pai-job-protocol.yaml) and job submission v2 ([#2260](https://github.com/microsoft/pai/pull/2260))
  - Add new job submission v2 plugin ([#2461](https://github.com/microsoft/pai/pull/2461))

* Web portal:
  - Add new home page ([#2544](https://github.com/microsoft/pai/pull/2544), [#2614](https://github.com/microsoft/pai/pull/2614))
  - User Management UX refactoring with new layout and themes ([#2726](https://github.com/microsoft/pai/pull/2726), [#2796](https://github.com/microsoft/pai/pull/2796))


## Improvements

* OpenPAI protocol:
  - Update example jobs in marketplace v2 for OpenPAI protocol ([#2827](https://github.com/microsoft/pai/pull/2827))

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
  - Allow user to use <kbd>Backspace</kbd> in `paictl` input ([#2769](https://github.com/microsoft/pai/pull/2769))
  - Disable InfiniBand driver installation by default ([#2595](https://github.com/microsoft/pai/pull/2595))


## Documentation

* Refine document of VS Code extension ([#2707](https://github.com/microsoft/pai/pull/2707))
* Add document for PAI storage ([#2822](https://github.com/microsoft/pai/pull/2822))
* OpenPAI protocol specification document ([#2260](https://github.com/microsoft/pai/pull/2260))
* Job submission v2 plugin document ([#2820](https://github.com/microsoft/pai/pull/2820))
* Update RESTful API document for API v2 ([#2816](https://github.com/microsoft/pai/pull/2816))
* Fix typos in document ([#2818](https://github.com/microsoft/pai/pull/2818))


## Bug Fixes

* Web portal:
  - Fix text broken when create or edit user ([#2849](https://github.com/microsoft/pai/pull/2849))
  - Fix token authentication bug ([#2843](https://github.com/microsoft/pai/pull/2843))
  - Fix retry count's margin-top ([#2845](https://github.com/microsoft/pai/pull/2845))
  - Fix job clone bug ([#2836](https://github.com/microsoft/pai/pull/2836))
  - Fix home page's responsive layout ([#2805](https://github.com/microsoft/pai/pull/2805))
  - Fix job list page filter bug ([#2787](https://github.com/microsoft/pai/pull/2787))
  - Fix home page failed to load virtual cluster list bug ([#2774](https://github.com/microsoft/pai/pull/2774))

* Rest server:
  - Check duplicate job in submission v2 ([#2837](https://github.com/microsoft/pai/pull/2837))

* Hadoop:
  - Increase YARN kill container timeout ([#2778](https://github.com/microsoft/pai/pull/2778))
  - Remove cross origin in resource manager ([#2758](https://github.com/microsoft/pai/pull/2758))
  - Fix Haddoop AI matching nvidia-smi regex ([#2681](https://github.com/microsoft/pai/pull/2681))


## Known Issues

* Deployments issues on NVIDIA DGX2 ([#2742](https://github.com/microsoft/pai/pull/2742))
