# PAI HivedScheduler DevOps

## Update Scheduling Config
**Description:**

Update Scheduling Config, such as CRUD for virtual clusters and gpu types.

**Steps:**
1. Stop Services and Pull Config
    ```bash
    ./paictl.py service stop -n rest-server
    ./paictl.py service stop -n hivedscheduler
    ./paictl.py config pull -o <your_local_config_path>
    ```

2. Update Scheduling Config

    Modify below sections of the pulled config file `<your_local_config_path>/services-configuration.yaml`:
    ```yaml
    hivedscheduler:
      config: |
        physicalCluster: <your_physical_clusters_config>
        virtualClusters: <your_virtual_clusters_config>
    ```

    For how to config them, please check [Config HivedScheduler](https://github.com/microsoft/hivedscheduler/blob/master/doc/user-manual.md#config)

3. Push Config and Start Services
    ```bash
    ./paictl.py config push -p <your_local_config_path>
    ./paictl.py service start -n hivedscheduler
    ./paictl.py service start -n rest-server
    ```
