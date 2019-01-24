import Hashids from "hashids";

import SimpleJob from "./SimpleJob";

import { nfs } from "../config";

function convertCommand(simpleJob: SimpleJob, user: string, hyperParameterValue?: number) {
  const depends: { [name: string]: boolean } = {};

  const exportCommands = simpleJob.environmentVariables.map(
    ({ name, value }) => `export ${name}=${value}`);
  if (hyperParameterValue !== undefined) {
    exportCommands.push(`export ${simpleJob.hyperParameterName}=${hyperParameterValue}`);
  }

  const mountCommands = [];
  if (nfs) {
    if (simpleJob.enableWorkMount) {
      mountCommands.push("mkdir --parents /work",
        `mount -t nfs4 ${nfs}/${user}/${simpleJob.workPath} /work`);
      depends["nfs-common"] = true;
    }

    if (simpleJob.enableDataMount) {
      mountCommands.push("mkdir --parents /data",
        `mount -t nfs4 ${nfs}/${user}/${simpleJob.dataPath} /data`);
      depends["nfs-common"] = true;
    }

    if (simpleJob.enableJobMount) {
      mountCommands.push("mkdir --parents /job",
        `mount -t nfs4 ${nfs}/${user}/${simpleJob.jobPath} /job`);
      depends["nfs-common"] = true;
    }
  }

  const hashids = new Hashids(user, 4, "0123456789ABCDEF");
  const uid = String(parseInt(hashids.encode(0), 16) + 10000);
  const gid = uid;
  const command = simpleJob.command.replace(/\$\$(username|uid|gid)\$\$/g, (_, key) => {
    if (key === "username") { return user; }
    if (key === "uid") { return uid; }
    if (key === "gid") { return gid; }
    throw Error("Bad replacement");
  });

  const userCommands = [];
  if (simpleJob.root) {
    userCommands.push(command);
  } else {
    // Create a user with group.
    userCommands.push(
      `groupadd --gid ${gid} ${user}`,
      `useradd --gid ${gid} --groups sudo --uid ${uid} ${user}`,
      "echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers",
      `echo '${command.replace(/'/g, "'\\''")}' | su --preserve-environment ${user}`,
    );
    depends.sudo = true;
  }

  const dependencies = Object.keys(depends);
  const installCommands = [];
  if (dependencies.length > 0) {
    installCommands.push(
      "apt-get update",
      `apt-get install --assume-yes ${dependencies.join(" ")}`,
    );
  }

  const commands = installCommands
    .concat(mountCommands)
    .concat(exportCommands)
    .concat(userCommands);

  return commands.join(" && ");
}

function convertTaskRole(name: string, simpleJob: SimpleJob, user: string, hyperParameterValue?: number) {
  const taskRole: any = {
    command: convertCommand(simpleJob, user, hyperParameterValue),
    gpuNumber: simpleJob.gpus,
    name,
  };

  if (simpleJob.isPrivileged) {
    taskRole.cpuNumber = simpleJob.cpus;
    taskRole.memoryMB = simpleJob.memory;
  }

  if (simpleJob.isInteractive) {
    const portList = [];
    const ports = simpleJob.interactivePorts.split(/[;,]/);
    for (const portString of ports) {
      const port = Number(portString);
      if (isNaN(port)) { continue; }
      portList.push({
        beginAt: port,
        label: `port_${port}`,
        portNumber: 1,
      });
    }
    taskRole.portList = portList;
  }

  return taskRole;
}

export default function convert(simpleJob: SimpleJob, user: string) {
  const job: any = {
    image: simpleJob.image,
    jobName: simpleJob.name,
  };

  const taskRoles = [];

  if (simpleJob.hyperParameterName === "") {
    taskRoles.push(convertTaskRole("master", simpleJob, user));
  } else {
    for (
      let hyperParameterValue = simpleJob.hyperParameterStartValue;
      hyperParameterValue < simpleJob.hyperParameterEndValue;
      hyperParameterValue += simpleJob.hyperParameterStep
    ) {
      const taskName = `hyper_parameter_${hyperParameterValue}`;
      const taskRole = convertTaskRole(taskName, simpleJob, user, hyperParameterValue);
      taskRoles.push(taskRole);
    }
  }

  if (simpleJob.enableTensorboard) {
    const tensorboardSimpleJob = new SimpleJob(simpleJob);
    tensorboardSimpleJob.gpus = 0;
    tensorboardSimpleJob.command = `tensorboard --logdir ${simpleJob.tensorboardModelPath} --host 0.0.0.0`;
    tensorboardSimpleJob.isInteractive = true;
    tensorboardSimpleJob.interactivePorts = "6006";

    taskRoles.push(convertTaskRole("tensorboard", tensorboardSimpleJob, user));
  }

  job.taskRoles = taskRoles;

  return job;
}
