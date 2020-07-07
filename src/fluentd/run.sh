for VAR in $(seq 1 10)
do
	curl -i -X POST -d "json={\"index\":$VAR, \"name\":\"piggy\"}" http://localhost:8888/testpg.cycle
done

