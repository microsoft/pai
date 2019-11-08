## Postgresql

Postgresql is an internal service for structured information persistence. By default, the service uses the folder `/paiInternal/storage` on the master node for data storage. The real data directory for the postgresql would be `/paiInternal/storage/pgdata`. The default service configurations are as follows:

```yaml
postgresql:
  enable: true
  user: root
  passwd: rootpass
  port: 5432
  db: openpai
``` 

One can override these settings by editing `services-configuration.yaml` .

### Table Initialization

If it is the first time the service launches, it will execute `src/init_table.sql` to initialize the table structure. The initialization won't be fired if the service detects old data. If you want to re-trigger it, please remove `/paiInternal/pgdata` and restart the service manually.

### How to Access the Database

The database connection string is written to the cluster configuration object in `config/postgresql.py`. One can use `cluster_cfg['postgresql']['connectionStr']` to retrieve it in any template files.

Particularly, the connection string is exposed as an environmental variable in `rest-server`:

```bash
# in rest-server pod
SQL_CONNECTION_STR=postgresql://root:rootpass@<master-ip>:5432/openpai
```
