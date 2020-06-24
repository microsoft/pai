
# td-agent
sudo /etc/init.d/td-agent restart

/var/log/td-agent/td-agent.log
sudo vim /etc/td-agent/td-agent.conf

sudo /usr/sbin/td-agent-gem install pg --version "=1.1.4"
path: /opt/td-agent/embedded/lib/ruby/gems/2.4.0/gems/fluent-plugin-pgjson

# postgres
select count(*) from test_pg;
delete from test_pg;

# docker 
cd src/fluentd
docker build -f build/fluentd.k8s.dockerfile -t gusui/fluentd:multiconn . --no-cache
docker build -f build/fluentd.k8s.dockerfile -t gusui/fluentd:threadlocal . --no-cache
docker push gusui/fluentd:original
docker run -p 8888:8888 -v $(pwd)/tmp:/fluentd/etc -e FLUENTD_CONF=fluentd.conf -d gusui/fluentd:original
docker run -p 8888:8888 -v $(pwd)/tmp:/fluentd/etc -e FLUENTD_CONF=fluentd.conf -d gusui/fluentd:multiconn
docker run -p 8888:8888 -v $(pwd)/tmp:/fluentd/etc -e FLUENTD_CONF=fluentd.conf -d gusui/fluentd:threadlocal

bash run.sh

docker ps

docker logs CONTAINERID
docker logs --tails 10 CONTAINERID

docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)