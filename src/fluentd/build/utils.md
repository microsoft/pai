
# td-agent
sudo /etc/init.d/td-agent restart

/var/log/td-agent/td-agent.log
sudo vim /etc/td-agent/td-agent.conf

sudo /usr/sbin/td-agent-gem install pg --version "=1.1.4"
path: /opt/td-agent/embedded/lib/ruby/gems/2.4.0/gems/fluent-plugin-pgjson

# postgres
psql -h 10.151.40.32 -W -U root -p 5432 openpai
select count(*) from test_pg;
delete from test_pg;

# docker 
cd src/fluentd
docker build -f build/fluentd.k8s.dockerfile -t gusui/fluentd:latest . --no-cache
docker run -p 8888:8888 -v $(pwd)/tmp:/fluentd/etc -e FLUENTD_CONF=fluentd.conf -d gusui/fluentd:latest

<!-- docker push gusui/fluentd:original -->
bash run.sh

docker ps

docker logs CONTAINERID
docker logs --tail 10 CONTAINERID

docker stop $(docker ps -a -q) && docker rm $(docker ps -a -q)


# log 
kubectl get configmap fluentd-config -o yaml	
kubectl get po
kubectl logs frameworkcontroller-sts-0 | grep Snapshot | grep kind\":\"Framework



# Database
psql -h 10.151.40.32 -W -U root -p 5432 openpai
rootpass 

CREATE TABLE IF NOT EXISTS fc_objectsnapshots ( tag Text, time Timestamptz, record JsonB );
CREATE TABLE IF NOT EXISTS framework_history (insertedAt Timestamptz, uid SERIAL, frameworkName VARCHAR(64), attemptIndex INTEGER,  historyType VARCHAR(16), snapshot JsonB);

CREATE TABLE IF NOT EXISTS pods (insertedAt Timestamptz, updatedAt Timestamptz, uid SERIAL, frameworkName VARCHAR(64), attemptIndex INTEGER,  taskroleName VARCHAR(256), taskroleIndex INTEGER, snapshot JsonB);

# fluentd service
./paictl.py config pull -o /cluster-configuration

## build and push fluentd 
./build/pai_build.py build -c /cluster-configuration/ -s fluentd
./build/pai_build.py push -c /cluster-configuration/ -i fluentd

## restart fluentd service
./paictl.py service stop -n fluentd
./paictl.py service start -n fluentd


