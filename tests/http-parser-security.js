// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Run from either src/rest-server or src/webportal. All traffic is loopback;
// adversarial inputs run in disposable children with a hard deadline.
const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");
const root = process.cwd();
const resolve = (name, from = root) => require.resolve(name, { paths: [from] });
const load = (name, from = root) => require(resolve(name, from));

async function requests() {
  const express = load("express");
  const bodyParser = load("body-parser");
  const http = require("http");
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(bodyParser.text({ type: "text/*" }));
  app.post("/job/:name", (req, res) =>
    res.json({ name: req.params.name, body: req.body })
  );
  app.use((err, req, res, next) =>
    res.status(err.status || 500).json({ type: err.type })
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const post = (body, type) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: server.address().port,
          method: "POST",
          path: "/job/training",
          headers: {
            "content-type": type,
            "content-length": Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () =>
            resolve({ status: res.statusCode, body: JSON.parse(data) })
          );
        }
      );
      req.setTimeout(2000, () =>
        req.destroy(new Error("local request timeout"))
      );
      req.on("error", reject);
      req.end(body);
    });
  try {
    const form = await post(
      "job[name]=train&job[roles][]=worker&job[roles][]=ps",
      "application/x-www-form-urlencoded"
    );
    assert.strictEqual(form.status, 200);
    assert.deepStrictEqual(form.body, {
      name: "training",
      body: { job: { name: "train", roles: ["worker", "ps"] } },
    });
    const json = await post(
      '{"job":{"name":"train","gpu":1}}',
      "application/json"
    );
    assert.strictEqual(json.status, 200);
    assert.deepStrictEqual(json.body.body, { job: { name: "train", gpu: 1 } });
    const yaml = "name: train\ntaskRoles: {}\n";
    assert.strictEqual((await post(yaml, "text/yaml")).body.body, yaml);
    assert.strictEqual((await post("{bad", "application/json")).status, 400);
    assert.strictEqual(
      (
        await post(
          "x=" + "a".repeat(110 * 1024),
          "application/x-www-form-urlencoded"
        )
      ).status,
      413
    );
    assert.strictEqual(
      (
        await post(
          Array(1002).fill("a=b").join("&"),
          "application/x-www-form-urlencoded"
        )
      ).status,
      413
    );
    // body-parser bounds qs nesting; this is a rejection regression, not a timing benchmark.
    const deep = await post(
      "a" + "[a]".repeat(40) + "=1",
      "application/x-www-form-urlencoded"
    );
    assert.strictEqual(deep.status, 400);
    const pollution = await post(
      "__proto__[polluted]=yes&constructor[prototype][polluted]=yes",
      "application/x-www-form-urlencoded"
    );
    assert.strictEqual(pollution.status, 200);
    assert.strictEqual({}.polluted, undefined);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function qsRoundTrip() {
  // Verify both actual parser closures, not an unrelated hoisted qs copy.
  for (const owner of ["express", "body-parser"]) {
    const qs = load("qs", path.dirname(resolve(owner + "/package.json")));
    for (const options of [{ plainObjects: true }, { allowPrototypes: true }]) {
      const parsed = qs.parse("x%5Bconstructor%5D%5BisBuffer%5D=y", options);
      assert.strictEqual(typeof qs.stringify(parsed), "string");
    }
    assert.deepStrictEqual(qs.parse("job[name]=train&job[gpu]=1"), {
      job: { name: "train", gpu: "1" },
    });
  }
}

function routeBacktracking() {
  const compile = load(
    "path-to-regexp",
    path.dirname(resolve("express/package.json"))
  );
  const re = compile("/:a-:b-:c");
  assert(re.test("/worker-ps-chief"));
  assert.strictEqual(re.test("/" + "a-".repeat(15000) + "a/x"), false);
}

const cases = { requests, qsRoundTrip, routeBacktracking };
if (process.argv[2]) {
  Promise.resolve()
    .then(cases[process.argv[2]])
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
} else {
  for (const name of Object.keys(cases)) {
    const child = spawnSync(process.execPath, [__filename, name], {
      encoding: "utf8",
      timeout: 10000,
    });
    assert.ifError(child.error);
    assert.strictEqual(child.status, 0, name + ": " + child.stderr);
    console.log("HTTP parser security: " + name + " passed");
  }
}
