import SimpleJob from "./SimpleJob";

import { nfs } from "../config";

function convertCommand(simpleJob: SimpleJob, user: string, hyperParameterValue?: number) {
  const uid = String(Math.floor(Math.random() * 90000 + 10000));
  const gid = String(Math.floor(Math.random() * 90000 + 10000));
  const command = simpleJob.command.replace(/\$\$(username|uid|gid)\$\$/g, (_, key) => {
    if (key === "username") { return user; }
    if (key === "uid") { return uid; }
    if (key === "gid") { return gid; }
    throw Error("Bad replacement");
  });

  const commands = [ command ];

  if (hyperParameterValue !== undefined) {
    commands.unshift(`export ${simpleJob.hyperParameterName}=${hyperParameterValue}`);
  }

  for (const variable of simpleJob.environmentVariables.reverse()) {
    commands.unshift(`export ${variable.name}=${variable.value}`);
  }

  if (nfs) {
    let nfsMounted = false;
    if (simpleJob.enableWorkMount) {
      commands.unshift("mkdir --parents /work", `mount -t nfs4 ${nfs}/${user}/${simpleJob.workPath} /work`);
      nfsMounted = true;
    }

    if (simpleJob.enableDataMount) {
      commands.unshift("mkdir --parents /data", `mount -t nfs4 ${nfs}/${user}/${simpleJob.dataPath} /data`);
      nfsMounted = true;
    }

    if (simpleJob.enableJobMount) {
      commands.unshift("mkdir --parents /job", `mount -t nfs4 ${nfs}/${user}/${simpleJob.jobPath} /job`);
      nfsMounted = true;
    }

    if (nfsMounted) {
      commands.unshift("apt-get update", "apt-get install --assume-yes nfs-common");
    }
  }

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
        portNumber: 1
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
