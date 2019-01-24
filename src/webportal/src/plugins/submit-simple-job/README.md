Submit Simple Job
=================

A PAI web portal plugin to submit simple job to PAI.

Install
-------

Config your `service-configuration.yaml` add/update the following fields to `webportal` section

```YAML
webportal:
  # ... other configs
  plugins:
  - title: Submit Simple Job
    uri: /scripts/plugins/submit-simple-job.js?nfs=[NFS host]:[NFS root]
```

Build
-----

    npm install
    npm run build --production

Contribute
----------

    npm install
    npm run build -- --watch
