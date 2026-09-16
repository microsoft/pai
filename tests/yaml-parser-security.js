// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Run from either service. No network or database is used. Bound adversarial
// parsing in a disposable child rather than risking an unbounded CI worker.
const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");
const yaml = require(require.resolve("js-yaml", { paths: [process.cwd()] }));

function normalJob() {
  const source = [
    "protocolVersion: 2",
    "name: parser-regression",
    "type: job",
    "prerequisites:",
    "  - name: runtime",
    "    type: dockerimage",
    "    uri: example.invalid/training:latest",
    "defaults: { virtualCluster: default }",
    "taskRoles:",
    "  worker:",
    "    instances: 1",
    "    dockerImage: runtime",
    "    resourcePerInstance: { cpu: 1, memoryMB: 1024, gpu: 0 }",
    '    commands: ["echo training"]',
  ].join("\n");
  const job = yaml.safeLoad(source);
  assert.strictEqual(job.protocolVersion, 2);
  assert.strictEqual(job.taskRoles.worker.resourcePerInstance.gpu, 0);
  assert.deepStrictEqual(job.taskRoles.worker.commands, ["echo training"]);
  assert.deepStrictEqual(yaml.safeLoad(yaml.safeDump(job)), job);
  assert.deepStrictEqual(
    yaml.safeLoad("base: &base {cpu: 1, gpu: 0}\nworker: {<<: *base, cpu: 2}")
      .worker,
    { cpu: 2, gpu: 0 }
  );
  assert.throws(
    () => yaml.safeLoad("taskRoles: [unterminated"),
    yaml.YAMLException
  );
  assert.throws(
    () => yaml.safeLoad('!!js/function "function () {}"'),
    yaml.YAMLException
  );
  assert.strictEqual({}.polluted, undefined);
}

function emptyMergeBudget() {
  // GHSA-2883-xcg3-v3hh: empty source mappings must consume merge budget too.
  // Small custom-budget case catches the defect without a large CPU workload.
  const small =
    "arr: &arr [{}, {}, {}, {}]\ntargets:\n" + "  - <<: *arr\n".repeat(3);
  assert.throws(
    () => yaml.safeLoad(small, { maxTotalMergeKeys: 8 }),
    /maxTotalMergeKeys/
  );
  // Exercise the default budget with a bounded ~3KB document (no timing assertion).
  const source =
    "arr: &arr [" +
    Array(100).fill("{}").join(",") +
    "]\ntargets:\n" +
    "  - <<: *arr\n".repeat(101);
  assert.throws(() => yaml.safeLoad(source), /maxTotalMergeKeys/);
}

const cases = { normalJob, emptyMergeBudget };
if (process.argv[2]) {
  cases[process.argv[2]]();
} else {
  for (const name of Object.keys(cases)) {
    const child = spawnSync(
      process.execPath,
      [path.resolve(__filename), name],
      { encoding: "utf8", timeout: 5000 }
    );
    assert.ifError(child.error);
    assert.strictEqual(child.status, 0, name + ": " + child.stderr);
    console.log("YAML parser security: " + name + " passed");
  }
}
