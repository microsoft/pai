Submit Simple Job
=================

A PAI web portal plugin to submit simple job to PAI.

Build
-----

    npm install
    npm run build

The build file is located in `./dist/plugin.js`

Deploy
-----

Deploy the build file to any server that accessible by web portal users. Write down the public url of the file for configuration.

Install
-------

Config your `service-configuration.yaml` add/update the following fields to `webportal` section

```YAML
webportal:
  # ... other configs
  plugins:
  - title: Submit Simple Job
    uri: "[plugin public url]?nfs=[NFS host]:[NFS root]&auth-file=hdfs:[hdfs uri]"
```

Configure
---------

Accroding to the YAML config in [Install section](#install), there are two config fields available, in query string syntax appended to the plugin file url: (** Don't forget to do character encoding **)

- `nfs` the NFS host and root directory, in `[host]:[root]` format, for example `nfs=10.0.0.1%3A%2Fusers`.
- `auth-file` the docker registry authorization file path in HDFS, in `hdfs:[path]` format, for example `auth-file=hdfs%3A%2F%2F10.0.0.1%3A8020%2Fauth.txt`.

Contribute
----------

Start the local web portal server with .env settings:

    WEBPORTAL_PLUGINS=[{"title":"Submit Simple Job", "uri": "/scripts/plugins/submit-simple-job.js"}]

And then run the builder within plugin directory.

    npm install
    npm run watch
