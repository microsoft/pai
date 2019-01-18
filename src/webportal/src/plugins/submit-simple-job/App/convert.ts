import SimpleJob from "./SimpleJob";

function convertTaskRole(name: string, simpleJob: SimpleJob) {
  const taskRole: any = {
    command: simpleJob.command,
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
        label: `port_${port}`,
        portNumber: port,
      });
    }
    taskRole.portList = portList;
  }

  return taskRole;
}

export default function convert(simpleJob: SimpleJob) {
  const job: any = {
    image: simpleJob.image,
    jobName: simpleJob.name,
  };

  const taskRoles = [];

  if (simpleJob.hyperParameterName === "") {
    taskRoles.push(convertTaskRole("master", simpleJob));
  } else {
    for (
      let hyperParameter = simpleJob.hyperParameterStartValue;
      hyperParameter < simpleJob.hyperParameterEndValue;
      hyperParameter += simpleJob.hyperParameterStep
    ) {
      const command = `export '${simpleJob.hyperParameterName}'=${hyperParameter} && ` + simpleJob.command;
      const simpleJobWithHyperParameter = simpleJob.set("command", command);
      const taskRole = convertTaskRole(`hyper_parameter_${hyperParameter}`, simpleJobWithHyperParameter);
      taskRoles.push(taskRole);
    }
  }

  if (simpleJob.enableTensorboard) {
    const tensorboardSimpleJob = simpleJob
      .set("gpus", 0)
      .set("command", `tensorboard --logdir ${simpleJob.tensorboardModelPath} --host 0.0.0.0`)
      .set("isInteractive", true)
      .set("interactivePorts", "6006");

    taskRoles.push(convertTaskRole("tensorboard", tensorboardSimpleJob));
  }

  job.taskRoles = taskRoles;

  const jobEnvs: any = {};
  for (const variable of simpleJob.environmentVariables) {
    jobEnvs[variable.name] = variable.value;
  }
  job.jobEnvs = jobEnvs;

  return job;
}
