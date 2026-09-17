// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Run from src/database-controller/src. Each case has a separate memory and
// time bound. Only loopback HTTP is allowed; SDK and cluster calls are mocked.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Module = require("module");
const http = require("http");
const { spawnSync } = require("child_process");
const root = process.cwd();
const load = name => require(require.resolve(name, { paths: [root] }));

function nativeAndSdk() {
  const usage = load("diskusage").checkSync(root);
  assert(usage.total > 0 && usage.available >= 0 && usage.free >= 0);
  assert.strictEqual(typeof load("openpaidbsdk"), "function");
  const installed = require.resolve("openpaidbsdk", { paths: [root] });
  assert.strictEqual(
    fs.readFileSync(installed, "utf8"),
    fs.readFileSync(path.resolve(root, "../sdk/index.js"), "utf8")
  );
}

function yamlNonemptyMergeBudget() {
  const yaml = load("js-yaml");
  const source =
    "base: &base {gpu: 1}\ntargets:\n" + "  - <<: *base\n".repeat(3);
  assert.strictEqual(
    yaml.safeLoad(source, { maxTotalMergeKeys: 6 }).targets.length,
    3
  );
  assert.throws(
    () => yaml.safeLoad(source, { maxTotalMergeKeys: 5 }),
    /maxTotalMergeKeys/
  );
}

async function writeMerger() {
  const records = [];
  const submittedBodies = [];
  let synchronizations = 0;
  let sdkConstructions = 0;
  const forbidden = () => {
    throw new Error("A regression attempted a real database or cluster call");
  };
  const logger = { warn() {}, info() {}, stream: { write() {} } };
  class DatabaseMock {
    constructor() {
      sdkConstructions++;
      this.Framework = {
        findOne: async () => null,
        create: async record => records.push(record),
        update: forbidden
      };
    }
  }
  const mocks = {
    "@dbc/common/logger": logger,
    "@dbc/common/k8s": new Proxy({}, { get: () => forbidden }),
    "@dbc/write-merger/config": { bodyLimit: "2kb" },
    openpaidbsdk: DatabaseMock,
    sequelize: { Sequelize: { ConnectionError: class extends Error {} } }
  };
  const originalLoad = Module._load;
  let app;
  Module._load = function(name, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(mocks, name)) return mocks[name];
    if (name === "pg" || name === "@kubernetes/client-node") return forbidden();
    if (name.indexOf("@dbc/") === 0) {
      const actual = originalLoad.call(
        this,
        path.join(root, name.slice("@dbc/".length)),
        parent,
        isMain
      );
      if (name === "@dbc/common/framework") {
        return Object.assign({}, actual, {
          silentSynchronizeRequest: () => synchronizations++,
          silentDeleteFramework: forbidden
        });
      }
      if (name === "@dbc/write-merger/handler") {
        return Object.assign({}, actual, {
          putFrameworkRequest: (req, res, next) => {
            submittedBodies.push(req.body);
            return actual.putFrameworkRequest(req, res, next);
          }
        });
      }
      return actual;
    }
    return originalLoad.call(this, name, parent, isMain);
  };
  try {
    app = require(path.join(root, "write-merger/app"));
  } finally {
    Module._load = originalLoad;
  }
  assert.strictEqual(sdkConstructions, 1);
  assert.strictEqual(
    Object.keys(require.cache).some(file =>
      /node_modules\/(?:sequelize|pg|@kubernetes\/client-node)\//.test(file)
    ),
    false
  );

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  let requestCount = 0;
  const put = (body, type, extraHeaders = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: server.address().port,
          method: "PUT",
          path: "/api/v1/frameworkRequest/train",
          headers: Object.assign(
            {
              "content-type": type,
              "content-length": Buffer.byteLength(body)
            },
            extraHeaders
          )
        },
        res => {
          let data = "";
          res.setEncoding("utf8");
          res.on("data", chunk => {
            data += chunk;
          });
          res.on("error", reject);
          res.on("end", () => {
            requestCount++;
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.setTimeout(2000, () =>
        req.destroy(new Error("Loopback request timeout"))
      );
      req.on("error", reject);
      req.end(body);
    });
  const yaml = load("js-yaml");
  const config = {
    name: "train",
    extras: {
      hivedScheduler: { jobPriorityClass: "test-priority" },
      jobStatusChangeNotification: { running: true, failed: true }
    }
  };
  const request = {
    frameworkRequest: {
      apiVersion: "frameworkcontroller.microsoft.com/v1",
      kind: "Framework",
      metadata: {
        name: "train",
        namespace: "default",
        labels: { userName: "test-user", virtualCluster: "default" },
        annotations: {
          jobName: "train",
          config: yaml.safeDump(config),
          totalGpuNumber: 2,
          logPathInfix: "test-user/train"
        }
      },
      spec: {
        executionType: "Start",
        taskRoles: [{ name: "worker", taskNumber: 2 }]
      }
    },
    submissionTime: "2026-01-01T00:00:00Z",
    configSecretDef: '{"kind":"Secret","metadata":{"name":"test-only"}}'
  };
  try {
    const created = await put(JSON.stringify(request), "application/json");
    assert.strictEqual(created.status, 200, JSON.stringify(created));
    assert.strictEqual(records.length, 1);
    const record = records[0];
    assert.strictEqual(record.name, "train");
    assert.strictEqual(record.userName, "test-user");
    assert.strictEqual(record.jobPriority, "test-priority");
    assert.strictEqual(record.totalTaskNumber, 2);
    assert.strictEqual(record.totalTaskRoleNumber, 1);
    assert.strictEqual(record.state, "WAITING");
    assert.strictEqual(record.notificationAtRunning, true);
    assert.strictEqual(record.notificationAtFailed, true);
    assert.strictEqual(record.notificationAtSucceeded, false);
    assert.strictEqual(record.configSecretDef, request.configSecretDef);
    assert.strictEqual(
      record.submissionTime.toISOString(),
      request.submissionTime.replace("Z", ".000Z")
    );
    assert.deepStrictEqual(yaml.safeLoad(record.jobConfig), config);
    assert.strictEqual(
      JSON.parse(record.snapshot).metadata.annotations.requestGeneration,
      "1"
    );
    assert.strictEqual(synchronizations, 1);

    const qs = load("qs");
    assert.strictEqual(
      (await put(qs.stringify(request), "application/x-www-form-urlencoded"))
        .status,
      200
    );
    assert.strictEqual(records.length, 2);
    assert.strictEqual(records[1].jobPriority, "test-priority");
    assert.strictEqual(
      submittedBodies[1].frameworkRequest.metadata.name,
      "train"
    );
    assert.strictEqual(synchronizations, 2);

    assert.strictEqual((await put("{bad", "application/json")).status, 400);
    assert.strictEqual(
      (await put(
        JSON.stringify({ padding: "a".repeat(2100) }),
        "application/json"
      )).status,
      413
    );
    assert.strictEqual(
      (await put("not gzip", "application/x-www-form-urlencoded", {
        "content-encoding": "gzip"
      })).status,
      400
    );
    assert.strictEqual(
      (await put("a=b", "application/x-www-form-urlencoded; charset=bogus"))
        .status,
      415
    );
    assert.strictEqual(
      (await put(
        "x=" + "a".repeat(110 * 1024),
        "application/x-www-form-urlencoded"
      )).status,
      413
    );
    assert.strictEqual(
      (await put(
        Array(1002)
          .fill("a=b")
          .join("&"),
        "application/x-www-form-urlencoded"
      )).status,
      413
    );
    assert.strictEqual(
      (await put(
        "a" + "[a]".repeat(40) + "=1",
        "application/x-www-form-urlencoded"
      )).status,
      400
    );
    const text = "name: train\n";
    assert.strictEqual((await put(text, "text/yaml")).status, 400);
    assert.strictEqual(submittedBodies[submittedBodies.length - 1], text);
    assert.strictEqual(
      (await put("a".repeat(110 * 1024), "text/plain")).status,
      413
    );

    request.frameworkRequest.metadata.name = "other";
    assert.strictEqual(
      (await put(JSON.stringify(request), "application/json")).status,
      400
    );
    request.frameworkRequest.metadata.name = "train";
    request.frameworkRequest.metadata.annotations.config = "[unterminated";
    const invalidYaml = await put(JSON.stringify(request), "application/json");
    assert.strictEqual(invalidYaml.status, 500);
    assert(/unexpected end/.test(invalidYaml.body.message));
    assert.strictEqual(records.length, 2);
    assert.strictEqual(synchronizations, 2);
    assert.strictEqual(requestCount, 13);
    console.log(
      "write-merger: 13 loopback requests; 2 real handler/Snapshot conversions"
    );
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

const localCases = { nativeAndSdk, yamlNonemptyMergeBudget, writeMerger };
const cases = [
  ["http-parser-security.js", "requests"],
  ["http-parser-security.js", "qsRoundTrip"],
  ["http-parser-security.js", "routeBacktracking"],
  ["yaml-parser-security.js", "normalJob"],
  ["yaml-parser-security.js", "emptyMergeBudget"]
].concat(
  Object.keys(localCases).map(name => [path.basename(__filename), name])
);

if (process.argv[2] !== undefined) {
  Promise.resolve()
    .then(() => {
      const name = process.argv[2];
      assert(
        Object.prototype.hasOwnProperty.call(localCases, name),
        "Unknown database parser case: " + name
      );
      return localCases[name]();
    })
    .catch(err => {
      console.error(err);
      process.exitCode = 1;
    });
} else {
  let failures = 0;
  for (const [file, name] of cases) {
    const child = spawnSync(
      process.execPath,
      ["--max-old-space-size=128", path.join(__dirname, file), name],
      { encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024 }
    );
    if (child.error || child.status !== 0) {
      failures++;
      console.error(
        name + ": " + (child.error ? child.error.message : child.stderr)
      );
    } else {
      process.stdout.write(child.stdout);
      console.log(name + " passed");
    }
  }
  console.log(
    "Database parser cases: " +
      (cases.length - failures) +
      " passed, " +
      failures +
      " failed"
  );
  if (failures) process.exitCode = 1;
}
