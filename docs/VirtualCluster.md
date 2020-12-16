# Virtual Cluster
## Overview 
To run jobs on MT, each customer group will first apply for a certain capacity token. Admin decide how to divide the applied resource into multiple virtual clusters offline. Jobs in the same virtual cluster will share and compete for capacity. Capacity in a virtual cluster will be first occupied by jobs in this virtual cluster, for the rest of them, it can be shared with jobs in the sibling virtual clusters but under the same root virtual cluster.

In this page, you can view and manage your VC(only manageable by VC admin). Currently we only support view; management will come soon. 

It lists all VCs and the corresponding sub clusters where the VC locates. After selecting your team vc and one sub cluster, you can 
* check the virtual cluster overall resource utilization and the parameters set to this virtual cluster (shown as Overview);
* check current active users in this VC and their resouce usage in each partition (shown as Active users); clicking the partition column (e.g. persist, besteffort, total) in the table,resource occupancy will be sorted, and data in the left pie graph will change accordingly;
* check the resource distribution among different partitions(shown as Partitions).
    * Resource configured to and utilized in each partition are clearly marked;
    * For each partition, expand the detail list and look for more detailed info. 
* click **View Jobs** link for the jobs running under this virtual cluster.
* click **Historical resource usage** link for resource usage in MDM counter.
