Before starting the stress test playbooks to setup environment.

1. Please create your own branch and modify rest-server's code for vk scheduling.

- Remove the following line

Line: https://github.com/microsoft/pai/blob/master/src/rest-server/src/models/v2/job/k8s.js#L465

- add the toleration configuration after this line.

Line: https://github.com/microsoft/pai/blob/master/src/rest-server/src/models/v2/job/k8s.js#L416

Toleration:
```Yaml
tolerations: [
    {
      key: "virtual-kubelet.io/provider",
      operator: "Equal",
      value: "mock",
      effect: "NoSchedule",
    }
]
```


2. Build image and push them into a registry

