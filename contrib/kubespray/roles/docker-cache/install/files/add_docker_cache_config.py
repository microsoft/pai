from pathlib import Path
import json


folder_path = Path("/etc/docker")
target_path = Path("/etc/docker/daemon.json")
backup_path = Path("/etc/docker/daemon.json.bk")

folder_path.mkdir(parents=True, exist_ok=True)
target_path.touch(mode=0o666)
backup_path.touch(mode=0o666)

with open(str(target_path)) as f:
    current_config = json.load(f);

with open(str(backup_path), 'w') as f:
    json.dump(current_config, f)

if "registry-mirrors" in current_config:
    current_config["registry-mirrors"].append("http://localhost:30500")
else:
    current_config["registry-mirrors"] = ["http://localhost:30500"]

if "insecure-registries" in current_config:
    current_config["insecure-registries"].append("http://localhost:30500")
else:
    current_config["insecure-registries"] = ["http://localhost:30500"]

with open(str(target_path), 'w') as f:
    json.dump(current_config, f)

