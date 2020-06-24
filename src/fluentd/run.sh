for VAR in $(seq 1 10000)
do
	curl -i -X POST -d "json={\"index\":$VAR}" http://localhost:8888/testpg.cycle
done

