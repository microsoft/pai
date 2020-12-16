# Aether/Marketplace module dev guideline
## Goal:
As we have the Aether and Marketplace two places’ modules to maintain. To keep maintenance simply in future and same experience for user, we have the below rule for module developing.

## Keep the same
**Parameter naming rule:** use big camel-case to name parameter. Like YarnCluster and JobQueue <br>
**Common parameter:** we have below common parameters for any module.<br>

| Parameter                                                  | Description                                 | 
| ----------------------------------------------------- | ------------------------------------ | 
| YarnCluster                | MT Yarn cluster.(BN2-0, BN2-1. etc, refer [sub-cluster](../../learn/subclusters.md)). We choose drop-down box style. | 
| JobQueue                | Queue assigned by MT to run job. | 
| JobNodeLabel                        | Nodelabel assigned by MT to run job, have better to set queue and nodelabel rather than use the default value which may face resource shortages.| 

**Sub-job name:** As we keep sub-job name is same as parent name(ignore prefix, launcher job must have to). If not follow this role, sub-job will miss.<br>
**Not allow** sub-job running in another sub-cluster, and not allow run multi-different type sub-job, we only support one type of sub-cluster as module focus on single feature.<br>

## Make it diversity

**Name prefix:** 

|                                                   | MarketPlace                                 | Aether |
| -------------------------------------------- | ------------------------------------ | --------- | 
| Backend service                | MPSRV_  |   SRV_ |
| Sub-job                | MPFL_(for launcher) MPSK_(for spark) | FL_ (for launcher)  SK_ (for spark) |
 

**Use _detail file to extend info:** Add _detail file to support parameter description, input parameter default value and parameter hidden option. And metadata to show on module list.

**Runtime diversity:** Use launcher service name to identify if it is hemera job driver or marketplace job driver to have different behavior for start script code. From hemera, service name as **hemera**, from marketplace as **marketplace**.

## GC modules
We will remove disabled module after 1 year.
