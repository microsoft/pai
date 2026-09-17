// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const assert = require("assert");
const fs = require("fs");
const http = require("http");
const Module = require("module");
const path = require("path");
const { Readable } = require("stream");
const { spawnSync } = require("child_process");
const { createGzip } = require("zlib");

const root = process.cwd();
const load = (name) => require(require.resolve(name, { paths: [root] }));
const axios = load("axios");
const logger = { info() {}, error() {} };

function adapter(relativePath, mocks = {}) {
  const filename = path.join(root, "src", relativePath);
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  instance.require = (name) => {
    if (Object.prototype.hasOwnProperty.call(mocks, name)) return mocks[name];
    if (name === "@pai/config/logger") return logger;
    if (name.startsWith("@pai/")) return adapter(name.slice(5) + ".js", mocks);
    return load(name);
  };
  instance._compile(fs.readFileSync(filename, "utf8"), filename);
  return instance.exports;
}

function body(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function redirect(res, location, status = 302) {
  res.writeHead(status, { Location: location });
  res.end();
}

async function origins(run) {
  const servers = [];
  const sockets = new Set();
  const handlers = [null, null];
  const urls = [];
  const failures = [];
  try {
    for (let i = 0; i < 2; i++) {
      const server = http.createServer((req, res) => {
        Promise.resolve()
          .then(() => handlers[i](req, res))
          .catch((error) => {
            failures.push(error);
            json(res, { message: error.message }, 500);
          });
      });
      server.on("connection", (socket) => {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
      });
      servers.push(server);
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      urls.push(`http://127.0.0.1:${server.address().port}`);
    }
    await run(urls, handlers);
    assert.deepStrictEqual(failures, []);
  } finally {
    for (const socket of sockets) socket.destroy();
    await Promise.all(
      servers.map((server) => new Promise((resolve) => server.close(resolve)))
    );
  }
}

async function rejects(operation, check) {
  let caught;
  try {
    await operation();
  } catch (error) {
    caught = error;
  }
  assert(caught, "expected the operation to reject");
  check(caught);
}

function stream(size) {
  let remaining = size;
  return new Readable({
    read() {
      if (!remaining) return this.push(null);
      const length = Math.min(remaining, 8);
      remaining -= length;
      this.push(Buffer.alloc(length, "x"));
    },
  });
}

function consume(input) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    input.on("data", (chunk) => {
      bytes += chunk.length;
    });
    input.on("end", () => resolve(bytes));
    input.on("error", reject);
  });
}

const cases = {
  async redirects() {
    await origins(async ([a, b], handlers) => {
      const echo = async (req, res) =>
        json(res, { headers: req.headers, body: (await body(req)).toString() });
      handlers[0] = (req, res) => {
        if (req.url === "/same") return redirect(res, a + "/echo");
        if (req.url === "/cross") return redirect(res, b + "/echo");
        if (req.url === "/body") return redirect(res, b + "/echo", 307);
        return echo(req, res);
      };
      handlers[1] = echo;
      const headers = {
        aUtHoRiZaTiOn: "Bearer local-fixture",
        cOoKiE: "session=local-fixture",
      };
      const same = await axios.get(a + "/same", { headers });
      assert.strictEqual(
        same.data.headers.authorization,
        headers.aUtHoRiZaTiOn
      );
      assert.strictEqual(same.data.headers.cookie, headers.cOoKiE);
      const cross = await axios.get(a + "/cross", { headers });
      assert.strictEqual(cross.data.headers.authorization, undefined);
      assert.strictEqual(cross.data.headers.cookie, undefined);
      const basic = await axios.get(a + "/cross", {
        auth: { username: "fixture", password: "not-a-secret" },
      });
      assert.strictEqual(basic.data.headers.authorization, undefined);
      // Redirect protection does not promise to redact a replayable 307 body.
      const payload = { password: "local-fixture-only" };
      const replay = await axios.post(a + "/body", payload);
      assert.deepStrictEqual(JSON.parse(replay.data.body), payload);
    });
  },

  async kubernetes() {
    await origins(async ([a, b], handlers) => {
      let otherRequests = 0;
      handlers[1] = (req, res) => {
        otherRequests++;
        json(res, {});
      };
      handlers[0] = (req, res) => {
        assert.strictEqual(req.headers.authorization, "Bearer local-fixture");
        assert.strictEqual(req.headers.accept, "application/json");
        if (req.url === "/redirect") return redirect(res, b);
        if (req.url === "/error")
          return json(res, { message: "local denial" }, 403);
        if (req.url === "/api/v1/nodes")
          return json(res, { items: ["node-a"] });
        return json(res, {
          path: req.url,
          contentType: req.headers["content-type"],
        });
      };
      const k8s = adapter("models/kubernetes/kubernetes.js", {
        "@pai/config/kubernetes": {
          apiserver: {
            uri: a,
            headers: { Authorization: "Bearer local-fixture" },
          },
        },
      });
      const client = k8s.getClient();
      assert.strictEqual(client.defaults.maxRedirects, 0);
      assert.deepStrictEqual(await k8s.getNodes(), { items: ["node-a"] });
      await rejects(
        () => client.get("/redirect"),
        (error) => assert.strictEqual(error.response.status, 302)
      );
      assert.strictEqual(otherRequests, 0);
      let observed;
      client.interceptors.response.use(null, (error) => {
        observed = error;
        throw error;
      });
      await rejects(
        () => client.get("/error"),
        (error) => {
          assert.strictEqual(error, observed);
          assert.strictEqual(error.response.status, 403);
          assert(error.message.includes("Url: /error"));
          assert(error.message.includes("Response message: local denial"));
        }
      );
      const patch = await client.patch("/pod", { spec: {} }, k8s.patchOption);
      assert.strictEqual(
        patch.data.contentType,
        "application/merge-patch+json"
      );
    });
  },

  async configuredProxy() {
    await origins(async ([a, b], handlers) => {
      const seen = [];
      handlers[0] = (req, res) => {
        seen.push({ path: req.url, headers: req.headers });
        if (req.url.endsWith("/redirect")) return redirect(res, b + "/final");
        json(res, { via: "proxy" });
      };
      handlers[1] = (req, res) =>
        json(res, { via: "direct", headers: req.headers });
      const proxy = {
        host: "127.0.0.1",
        port: Number(a.split(":").pop()),
        protocol: "http:",
        auth: { username: "fixture", password: "not-a-secret" },
      };
      const result = await axios.get(b + "/redirect", { proxy });
      assert.strictEqual(result.data.via, "proxy");
      assert.deepStrictEqual(
        seen.map((entry) => entry.path),
        [b + "/redirect", b + "/final"]
      );
      for (const entry of seen) {
        assert.strictEqual(
          entry.headers["proxy-authorization"],
          "Basic " + Buffer.from("fixture:not-a-secret").toString("base64")
        );
        assert.strictEqual(entry.headers.host, b.slice(7));
      }
      process.env.http_proxy = a;
      const direct = await axios.get(b, { proxy: false });
      assert.strictEqual(direct.data.via, "direct");
      assert.strictEqual(direct.data.headers["proxy-authorization"], undefined);
      delete process.env.http_proxy;
    });
  },

  async proxyToDirectRedirect() {
    await origins(async ([a, b], handlers) => {
      let proxyHits = 0;
      handlers[0] = (req, res) => {
        proxyHits++;
        assert(req.headers["proxy-authorization"]);
        redirect(res, b + "/direct");
      };
      handlers[1] = (req, res) => json(res, req.headers);
      process.env.http_proxy = a.replace("http://", "http://fixture:local@");
      process.env.no_proxy = b.slice(7);
      const result = await axios.get(a + "/start", { maxRedirects: 2 });
      assert.strictEqual(proxyHits, 1);
      assert.strictEqual(result.data["proxy-authorization"], undefined);
      delete process.env.http_proxy;
      delete process.env.no_proxy;
    });
  },

  async absoluteUrls() {
    await origins(async ([a, b], handlers) => {
      handlers[0] = (req, res) => json(res, { origin: "base", path: req.url });
      handlers[1] = (req, res) =>
        json(res, { origin: "other", headers: req.headers });
      const client = axios.create({
        baseURL: a + "/api/",
        headers: { Authorization: "Bearer local-fixture" },
      });
      assert.strictEqual((await client.get("nodes")).data.path, "/api/nodes");
      // Existing callers retain Axios's default absolute-URL override behavior.
      const absolute = await client.get(b + "/nodes");
      assert.strictEqual(absolute.data.origin, "other");
      assert.strictEqual(
        absolute.data.headers.authorization,
        "Bearer local-fixture"
      );
      const restricted = await client.get(b + "/nodes", {
        allowAbsoluteUrls: false,
      });
      assert.strictEqual(restricted.data.origin, "base");
      assert.strictEqual(restricted.data.path, "/api/" + b + "/nodes");
    });
  },

  async streamedUploads() {
    await origins(async ([a], handlers) => {
      handlers[0] = async (req, res) => {
        // An intentionally cancelled upload may abort before reaching its cap.
        req.on("error", (error) => {
          if (error.code !== "ECONNRESET") throw error;
        });
        let size = 0;
        req.on("data", (chunk) => {
          size += chunk.length;
        });
        req.on("end", () => json(res, { size }));
      };
      for (const maxRedirects of [0, 5]) {
        const config = { maxRedirects, maxBodyLength: 32 };
        assert.strictEqual(
          (await axios.post(a, stream(32), config)).data.size,
          32
        );
        await rejects(
          () => axios.post(a, stream(33), config),
          (error) => assert(/maxBodyLength/.test(error.message))
        );
      }
    });
  },

  async streamedResponses() {
    await origins(async ([a], handlers) => {
      handlers[0] = (req, res) => {
        const [, encoding, size] = req.url.split("/");
        const source = stream(Number(size));
        if (encoding === "gzip") {
          res.setHeader("Content-Encoding", "gzip");
          source.pipe(createGzip()).pipe(res);
        } else {
          source.pipe(res);
        }
      };
      for (const encoding of ["identity", "gzip"]) {
        for (const responseType of ["stream", "arraybuffer"]) {
          const config = { responseType, maxContentLength: 32 };
          const good = await axios.get(a + "/" + encoding + "/32", config);
          assert.strictEqual(
            responseType === "stream"
              ? await consume(good.data)
              : good.data.length,
            32
          );
          await rejects(
            async () => {
              const response = await axios.get(
                a + "/" + encoding + "/33",
                config
              );
              if (responseType === "stream") await consume(response.data);
            },
            (error) => assert(/maxContentLength/.test(error.message))
          );
        }
      }
    });
  },

  async multipart() {
    const FormData = require(require.resolve("form-data", {
      paths: [require.resolve("axios", { paths: [root] })],
    }));
    await origins(async ([a], handlers) => {
      handlers[0] = async (req, res) =>
        json(res, {
          type: req.headers["content-type"],
          text: (await body(req)).toString(),
        });
      const form = new FormData();
      form.append("description", "ordinary field");
      form.append("file", Buffer.from("file bytes\n"), {
        filename: "folder/result.txt",
        contentType: "text/plain",
      });
      const boundary = form.getBoundary();
      assert.notStrictEqual(new FormData().getBoundary(), boundary);
      const result = await axios.post(a, form, { headers: form.getHeaders() });
      assert.strictEqual(
        result.data.type,
        "multipart/form-data; boundary=" + boundary
      );
      assert(result.data.text.startsWith("--" + boundary + "\r\n"));
      assert(result.data.text.endsWith("--" + boundary + "--\r\n"));
      assert(
        result.data.text.includes('name="description"\r\n\r\nordinary field')
      );
      assert(result.data.text.includes('name="file"; filename="result.txt"'));
      assert(
        result.data.text.includes(
          "Content-Type: text/plain\r\n\r\nfile bytes\n"
        )
      );
      const escaped = new FormData();
      escaped.append('field"\r\nInjected: value', Buffer.from("payload"), {
        filename: 'file"\r\nInjected: value.txt',
      });
      const escapedResult = await axios.post(a, escaped, {
        headers: escaped.getHeaders(),
      });
      assert(!escapedResult.data.text.includes("\r\nInjected:"));
      assert(escapedResult.data.text.includes("%22%0D%0AInjected: value"));
    });
  },

  async ordinaryAdapters() {
    await origins(async ([a], handlers) => {
      let fail = false;
      handlers[0] = (req, res) => {
        if (fail) return json(res, { message: "fixture unavailable" }, 503);
        if (req.url.startsWith("/GetUserId"))
          return json(res, { groups: ["team-a"] });
        assert.strictEqual(req.headers.authorization, "Bearer fixture-token");
        if (req.url === "/v1.0/me/transitiveMemberOf") {
          return json(res, {
            value: [{ mailNickname: "team-a" }],
            "@odata.nextLink": a + "/page2",
          });
        }
        json(res, {
          value: [{ mailNickname: "team-b" }, { displayName: "ignored" }],
        });
      };
      const graph = adapter("utils/manager/group/adapter/msGraphAdapter.js");
      const config = graph.initConfig(a + "/", "fixture-token");
      assert.deepStrictEqual(await graph.getUserGroupList("alice", config), [
        "team-a",
        "team-b",
      ]);
      const winbind = adapter("utils/manager/group/adapter/winbindAdapter.js");
      assert.deepStrictEqual(
        await winbind.getUserGroupList("alice", winbind.initConfig(a)),
        ["team-a"]
      );
      fail = true;
      await rejects(
        () => graph.getUserGroupList("alice", config),
        (error) => assert.strictEqual(error.response.status, 503)
      );
    });
  },

  async groupAdapterRedirects() {
    await origins(async ([a, b], handlers) => {
      const graph = adapter("utils/manager/group/adapter/msGraphAdapter.js");
      const config = graph.initConfig(a + "/", "fixture-token");
      let otherRequests = 0;
      handlers[0] = (req, res) => {
        if (req.url === "/v1.0/me/transitiveMemberOf") {
          assert.strictEqual(req.headers.authorization, config.Authorization);
          return redirect(res, b + "/groups");
        }
        assert(req.url.startsWith("/GetUserId?"));
        redirect(res, b + "/groups");
      };
      handlers[1] = (req, res) => {
        otherRequests++;
        assert.strictEqual(req.url, "/groups");
        assert.strictEqual(req.headers.authorization, undefined);
        json(res, { value: [{ mailNickname: "team-a" }] });
      };
      assert.deepStrictEqual(await graph.getUserGroupList("alice", config), [
        "team-a",
      ]);
      assert.strictEqual(otherRequests, 1);
      const winbind = adapter("utils/manager/group/adapter/winbindAdapter.js");
      await rejects(
        () => winbind.getUserGroupList("alice", winbind.initConfig(a)),
        (error) => assert.strictEqual(error.response.status, 302)
      );
      assert.strictEqual(otherRequests, 1);
    });
  },

  async logManager() {
    await origins(async ([a], handlers) => {
      let status = 200;
      handlers[0] = async (req, res) => {
        if (req.url === "/api/v1/tokens") {
          assert.deepStrictEqual(JSON.parse(await body(req)), {
            username: "fixture-admin",
            password: "fixture-password",
          });
          return json(res, { token: "fixture-token" });
        }
        const url = new (require("url").URL)(req.url, a);
        assert.strictEqual(url.pathname, "/api/v1/logs");
        assert.strictEqual(url.searchParams.get("token"), "fixture-token");
        assert.strictEqual(url.searchParams.get("username"), "alice");
        assert.strictEqual(url.searchParams.get("framework-name"), "job");
        assert.strictEqual(url.searchParams.get("pod-uid"), "pod-fixture");
        json(res, status === 200 ? { stdout: "/stdout?offset=0" } : {}, status);
      };
      const log = adapter("models/v2/job/log.js", {
        "@azure/storage-blob": {},
        "@pai/config/launcher": {
          logServer: "log_manager",
          logManagerPort: Number(a.split(":").pop()),
          logManagerAdminName: "fixture-admin",
          logManagerAdminPassword: "fixture-password",
        },
        "@pai/models/v2/task": {
          get: async (...args) => {
            assert.deepStrictEqual(args, ["job", 1, "worker", 0]);
            return {
              data: {
                username: "alice",
                attempts: [
                  {
                    attemptId: 2,
                    containerIp: "127.0.0.1",
                    containerId: "pod-fixture",
                  },
                ],
              },
            };
          },
        },
      });
      const get = () =>
        log.getLogListFromLogServer("job", "1", "worker", "0", "2", "true");
      assert.deepStrictEqual(await get(), {
        locations: [
          {
            name: "stdout",
            uri:
              "/log-manager/" + a.slice(7) + "/stdout?offset=0&tail-mode=true",
          },
        ],
      });
      status = 404;
      await rejects(get, (error) => {
        assert.strictEqual(error.status, 404);
        assert.strictEqual(error.code, "NoTaskLogError");
      });
      status = 503;
      await rejects(get, (error) =>
        assert.strictEqual(error.response.status, 503)
      );
    });
  },

  async aadTokenExchange() {
    await origins(async ([a], handlers) => {
      let fail = false;
      const token = load("jsonwebtoken").sign(
        { upn: "alice@example.invalid" },
        "fixture-signing-key"
      );
      handlers[0] = async (req, res) => {
        assert.strictEqual(req.url, "/token");
        assert.strictEqual(
          req.headers["content-type"],
          "application/x-www-form-urlencoded"
        );
        const params = load("querystring").parse((await body(req)).toString());
        assert.strictEqual(params.client_secret, "fixture&secret");
        assert.strictEqual(params.code, "fixture+code");
        assert.strictEqual(params.grant_type, "authorization_code");
        if (fail) return json(res, { message: "fixture denial" }, 503);
        json(res, {
          id_token: token,
          access_token: token,
          refresh_token: "fixture-refresh",
        });
      };
      const aad = adapter("controllers/v2/azureAD.js", {
        "@pai/config/authn": {
          OIDCConfig: {
            msgraph_host: "example.invalid",
            clientID: "fixture-client",
            clientSecret: "fixture&secret",
            redirectUrl: a + "/return",
            token_endpoint: a + "/token",
          },
          groupConfig: { groupDataSource: "ms-graph" },
        },
      });
      const req = {
        body: {
          code: "fixture+code",
          state: JSON.stringify({ redirect: "/jobs", from: "/login" }),
        },
      };
      const exchange = () =>
        new Promise((resolve, reject) => {
          aad.requestTokenWithCode(req, {}, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      await exchange();
      assert.strictEqual(req.undecodedAccessToken, token);
      assert.strictEqual(req.accessToken.upn, "alice@example.invalid");
      assert.strictEqual(req.undecodedRefreshToken, "fixture-refresh");
      assert.strictEqual(req.returnBackURI, "/jobs");
      assert.strictEqual(req.fromURI, "/login");
      fail = true;
      await rejects(exchange, (error) => {
        assert.strictEqual(error.status, 500);
        assert.strictEqual(error.code, "UnknownError");
        assert(error.message.includes("503"));
      });
    });
  },

  async cancellationAndTimeout() {
    await origins(async ([a], handlers) => {
      handlers[0] = () => {};
      await rejects(
        () => axios.get(a, { timeout: 30 }),
        (error) => assert.strictEqual(error.code, "ECONNABORTED")
      );
      const source = axios.CancelToken.source();
      let arrived;
      const received = new Promise((resolve) => {
        arrived = resolve;
      });
      handlers[0] = (req) => {
        assert.strictEqual(req.url, "/cancel");
        arrived();
      };
      const request = axios.get(a + "/cancel", { cancelToken: source.token });
      const cancelled = rejects(
        () => request,
        (error) => {
          assert(axios.isCancel(error));
          assert.strictEqual(error.message, "local cancellation");
        }
      );
      await received;
      source.cancel("local cancellation");
      await cancelled;
    });
  },
};

if (process.argv[2]) {
  for (const key of Object.keys(process.env)) {
    if (/_proxy$/i.test(key)) delete process.env[key];
  }
  axios.defaults.timeout = 1000;
  cases[process.argv[2]]().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const child = spawnSync(
      process.execPath,
      ["--max-old-space-size=128", __filename, name],
      {
        encoding: "utf8",
        timeout: 8000,
        maxBuffer: 256 * 1024,
      }
    );
    if (child.error || child.status !== 0) {
      failures++;
      console.error(name + ": " + (child.error || child.stderr));
    } else {
      console.log("REST outbound: " + name + " passed");
    }
  }
  assert.strictEqual(failures, 0, "REST outbound regressions failed");
}
