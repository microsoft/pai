// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Run from src/alert-manager/src/alert-handler with Node 24.
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { gzipSync } = require('node:zlib');
const root = process.cwd();
const load = (name) => require(require.resolve(name, { paths: [root] }));

function service() {
  const net = require('node:net');
  const connect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (...args) {
    const options = Array.isArray(args[0]) ? args[0][0] : args[0];
    assert.equal(
      options.host,
      '127.0.0.1',
      'only loopback connections allowed',
    );
    return connect.apply(this, args);
  };
  const k8s = load('@kubernetes/client-node');
  k8s.KubeConfig.prototype.loadFromDefault = function () {
    this.loadFromOptions({
      clusters: [{ name: 'fixture', server: process.env.MOCK_URI }],
      users: [{ name: 'fixture', token: 'fixture-kube-token' }],
      contexts: [{ name: 'fixture', cluster: 'fixture', user: 'fixture' }],
      currentContext: 'fixture',
    });
  };
  const mail = [];
  let failMail = false;
  const nodemailer = load('nodemailer');
  const createTransport = nodemailer.createTransport;
  nodemailer.createTransport = function () {
    const transport = createTransport({ streamTransport: true, buffer: true });
    const sendMail = transport.sendMail.bind(transport);
    transport.sendMail = async function (message) {
      if (failMail) throw new Error('fixture transport failure');
      const info = await sendMail(message);
      mail.push({
        envelope: info.envelope,
        subject: message.subject,
        html: message.html,
        text: message.text,
        mime: info.message.toString(),
      });
      return info;
    };
    return transport;
  };
  const Email = load('email-templates');
  const send = Email.prototype.send;
  Email.prototype.send = function (options) {
    assert.equal(this.config.preview, false, 'production must disable preview');
    const prefix = '/etc/alerthandler/templates/';
    assert.ok(options.template.startsWith(prefix));
    const template = options.template.slice(prefix.length);
    assert.match(template, /^[a-z-]+$/);
    return send.call(this, {
      ...options,
      template: path.resolve(root, '../../deploy/alert-templates', template),
    });
  };
  const listen = http.Server.prototype.listen;
  http.Server.prototype.listen = function (port, callback) {
    this.once('listening', () =>
      process.send({ type: 'ready', port: this.address().port }),
    );
    return listen.call(this, 0, '127.0.0.1', callback);
  };
  const intervals = [];
  global.setInterval = (callback, delay) => {
    intervals.push({ callback, delay });
    return { unref() {} };
  };
  process.on('message', (message) => {
    if (message.action === 'fail-mail') failMail = message.value;
    if (message.action === 'cleanup') intervals[0].callback();
    process.send({
      type: 'state',
      id: message.id,
      mail,
      intervals: intervals.map((item) => item.delay),
    });
  });
  require(path.join(root, 'index.js'));
}

async function run(t) {
  const observed = [];
  let restFailure = false;
  let kubeFailure = false;
  const mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      observed.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body ? JSON.parse(body) : null,
      });
      mock.emit('observed', observed.at(-1));
      res.setHeader('content-type', 'application/json');
      if (req.url.startsWith('/api/v2/')) {
        res.statusCode = restFailure ? 503 : 200;
        res.end(JSON.stringify({ email: 'user@example.test' }));
      } else if (kubeFailure) {
        res.statusCode = 503;
        res.end(JSON.stringify({ message: 'fixture unavailable' }));
      } else if (req.method === 'GET') {
        res.end(
          JSON.stringify({
            items: [
              {
                metadata: { name: 'expired-fixture' },
                status: {
                  succeeded: 1,
                  completionTime: '2020-01-01T00:00:00Z',
                },
              },
            ],
          }),
        );
      } else {
        res.end('{}');
      }
    });
  });
  mock.listen(0, '127.0.0.1');
  await once(mock, 'listening');
  t.after(() => mock.close());
  const uri = `http://127.0.0.1:${mock.address().port}`;
  const child = fork(__filename, ['--service'], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      NODE_ENV: 'production',
      SERVER_PORT: '0',
      MOCK_URI: uri,
      REST_SERVER_URI: uri,
      EMAIL_CONFIGS_SMTP_HOST: '127.0.0.1',
      EMAIL_CONFIGS_SMTP_PORT: '1',
      EMAIL_CONFIGS_SMTP_FROM: 'sender@example.test',
      EMAIL_CONFIGS_ADMIN_RECEIVER: 'admin@example.test',
      CLUSTER_ID: 'runtime-fixture',
      WEBPORTAL_URI: uri,
      LOG_LEVEL: 'error',
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    execArgv: ['--max-old-space-size=256', '--unhandled-rejections=strict'],
  });
  let output = '';
  child.stdout.on('data', (data) => {
    output += data;
  });
  child.stderr.on('data', (data) => {
    output += data;
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
  });
  const ready = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`startup timeout\n${output}`)),
      10000,
    );
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`service exited ${code}\n${output}`));
    });
    child.on('message', (message) => {
      if (message.type === 'ready') {
        clearTimeout(timer);
        resolve(message);
      }
    });
  });
  let sequence = 0;
  const state = (action = 'state', value) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const listener = (message) => {
        if (message.id === id) {
          clearTimeout(timer);
          child.removeListener('message', listener);
          resolve(message);
        }
      };
      const timer = setTimeout(() => {
        child.removeListener('message', listener);
        reject(new Error('fixture IPC timeout'));
      }, 3000);
      child.on('message', listener);
      child.send({ action, value, id });
    });
  const post = (route, body, extra = {}) =>
    new Promise((resolve, reject) => {
      const payload =
        Buffer.isBuffer(body) || typeof body === 'string'
          ? body
          : JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: ready.port,
          path: `/alert-handler/${route}`,
          method: 'POST',
          headers: { 'content-type': 'application/json', ...extra },
        },
        (res) => {
          let text = '';
          res.on('data', (data) => {
            text += data;
          });
          res.on('end', () => resolve({ status: res.statusCode, text }));
        },
      );
      req.setTimeout(3000, () =>
        req.destroy(new Error('fixture request timeout')),
      );
      req.on('error', reject);
      req.end(payload);
    });
  const firing = {
    status: 'firing',
    labels: {
      job_name: 'alice~job',
      username: 'alice',
      node_name: 'node-a',
      alertname: 'Runtime',
    },
    annotations: { summary: 'Runtime <fixture>' },
    generatorURL: uri,
  };
  const payload = {
    alerts: [firing, { ...firing, status: 'resolved' }],
    groupLabels: { alertname: 'Runtime', severity: 'warning' },
    externalURL: uri,
  };
  await t.test(
    'starts real entrypoint and preserves hourly cleanup',
    async () => {
      assert.deepEqual((await state()).intervals, [3600000]);
      assert.equal((await post('stop-jobs', { alerts: [] })).status, 200);
      assert.equal(
        (await post('send-email-to-user', { alerts: [] })).status,
        200,
      );
      assert.equal(observed.length, 0);
    },
  );
  await t.test(
    'JSON bounds, compressed input and unsupported modes',
    async () => {
      assert.equal((await post('stop-jobs', '{bad')).status, 400);
      assert.equal(
        (await post('stop-jobs', { data: 'x'.repeat(110 * 1024) })).status,
        413,
      );
      assert.equal(
        (
          await post('stop-jobs', gzipSync('{"alerts":[]}'), {
            'content-encoding': 'gzip',
          })
        ).status,
        200,
      );
      assert.equal(
        (await post('stop-jobs', '{}', { 'content-encoding': 'unsupported' }))
          .status,
        415,
      );
      assert.equal(
        (
          await post('stop-jobs', 'alerts=[]', {
            'content-type': 'application/x-www-form-urlencoded',
          })
        ).status,
        500,
      );
      assert.equal((await post('missing', { alerts: [] })).status, 404);
    },
  );
  await t.test(
    'REST actions filter resolved alerts and forward bearer tokens',
    async () => {
      const headers = { authorization: 'Bearer fixture-rest-token' };
      assert.equal(
        (await post('stop-jobs', payload, headers)).status,
        200,
        output,
      );
      const stop = observed.at(-1);
      assert.equal(stop.method, 'PUT');
      assert.equal(stop.url, '/api/v2/jobs/alice~job/executionType');
      assert.equal(stop.headers.authorization, 'Bearer fixture-rest-token');
      assert.deepEqual(stop.body, { value: 'STOP' });
      const count = observed.length;
      assert.equal(
        (await post('tag-jobs/runtime', payload, headers)).status,
        200,
      );
      assert.equal(observed.length, count + 1);
      assert.equal(observed.at(-1).url, '/api/v2/jobs/alice~job/tag');
      assert.deepEqual(observed.at(-1).body, { value: 'runtime' });
      assert.equal(
        (await post('stop-jobs?access_token=duplicate', payload, headers))
          .status,
        400,
      );
      restFailure = true;
      assert.equal((await post('stop-jobs', payload, headers)).status, 500);
      restFailure = false;
    },
  );
  await t.test(
    'Kubernetes client serializes node patches and surfaces failures',
    async () => {
      assert.equal((await post('cordon-nodes', payload)).status, 200, output);
      const patch = observed.at(-1);
      assert.equal(patch.method, 'PATCH');
      assert.equal(patch.url, '/api/v1/nodes/node-a');
      assert.equal(patch.headers.authorization, 'Bearer fixture-kube-token');
      assert.equal(
        patch.headers['content-type'],
        'application/strategic-merge-patch+json',
      );
      assert.deepEqual(patch.body, { spec: { unschedulable: true } });
      kubeFailure = true;
      assert.equal((await post('cordon-nodes', payload)).status, 500);
      kubeFailure = false;
    },
  );
  await t.test(
    'scheduled cleanup lists and deletes only disposable mock jobs',
    async () => {
      const deleted = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          mock.removeListener('observed', listener);
          reject(new Error('cleanup request timeout'));
        }, 3000);
        const listener = (request) => {
          if (request.method === 'DELETE') {
            clearTimeout(timer);
            mock.removeListener('observed', listener);
            resolve(request);
          }
        };
        mock.on('observed', listener);
      });
      await state('cleanup');
      const request = await deleted;
      assert.equal(
        request.url,
        '/apis/batch/v1/namespaces/default/jobs/expired-fixture',
      );
      const list = observed.find(
        (item) =>
          item.method === 'GET' &&
          item.url.startsWith('/apis/batch/v1/namespaces/default/jobs?'),
      );
      const url = new URL(list.url, uri);
      assert.equal(
        url.searchParams.get('labelSelector'),
        'created-by=alert-handler,time-to-live=24h',
      );
    },
  );
  await t.test(
    'actual EJS rendering and Nodemailer stream delivery preserve recipients',
    async () => {
      assert.equal((await post('send-email-to-admin', payload)).status, 200);
      const [mail] = (await state()).mail;
      assert.deepEqual(mail.envelope, {
        from: 'sender@example.test',
        to: ['admin@example.test'],
      });
      assert.match(
        mail.subject,
        /runtime-fixture warning:.*FIRING: 1.*Runtime/s,
      );
      assert.match(mail.html, /Runtime &lt;fixture&gt;/);
      assert.match(mail.text, /Runtime <fixture>/);
      assert.match(mail.mime, /To: admin@example.test/);
      assert.equal(
        (await post('send-email-to-admin?template=missing-fixture', payload))
          .status,
        500,
      );
      await state('fail-mail', true);
      assert.equal((await post('send-email-to-admin', payload)).status, 500);
      await state('fail-mail', false);
    },
  );
  await t.test(
    'user lookup uses REST bearer authentication without real SMTP',
    async () => {
      assert.equal(
        (
          await post('send-email-to-user', payload, {
            authorization: 'Bearer fixture-user-token',
          })
        ).status,
        200,
        output,
      );
      const lookup = observed.find(
        (item) => item.url === '/api/v2/users/alice',
      );
      assert.equal(lookup.headers.authorization, 'Bearer fixture-user-token');
      const current = await state();
      assert.equal(current.mail.length, 2);
      assert.deepEqual(current.mail[1].envelope.to, ['user@example.test']);
    },
  );
  await t.test(
    'user-mail failure returns 500 and the same service handles a later delivery',
    async () => {
      const headers = { authorization: 'Bearer fixture-recovery-token' };
      const pid = child.pid;
      const before = (await state('fail-mail', true)).mail.length;
      const failed = await post('send-email-to-user', payload, headers);
      assert.equal(failed.status, 500, output);
      assert.deepEqual(JSON.parse(failed.text), {
        message: 'alert-handler failed to send email to users',
      });
      assert.equal((await state()).mail.length, before);
      assert.equal(child.exitCode, null, output);
      assert.equal(child.signalCode, null, output);
      await state('fail-mail', false);
      const succeeded = await post('send-email-to-user', payload, headers);
      assert.equal(succeeded.status, 200, output);
      assert.deepEqual(JSON.parse(succeeded.text), {
        message: 'alert-handler successfully send emails to users',
      });
      const current = await state();
      assert.equal(current.mail.length, before + 1);
      assert.deepEqual(current.mail.at(-1).envelope.to, ['user@example.test']);
      assert.equal(child.pid, pid);
      assert.equal(child.exitCode, null, output);
      assert.equal(child.signalCode, null, output);
    },
  );
  await t.test(
    'all configured template names render through the mail controller',
    async () => {
      const expected = {
        'job-status-change': 'Job Status Change Alert',
        'kill-low-efficiency-job-alert': 'Low Efficiency Job Alert',
        'cluster-usage': 'Cluster GPU Utilization for One Week',
      };
      const templatePayload = {
        ...payload,
        alerts: [
          {
            ...firing,
            labels: {
              ...firing.labels,
              cluster_usage: '37.5%',
              usage: '25%',
              resources_occupied: '48',
              gpu_number: '2',
              duration: '1d',
              start_time: '2026-09-17',
              status: 'running',
            },
          },
        ],
      };
      for (const [template, subject] of Object.entries(expected)) {
        assert.equal(
          (
            await post(
              `send-email-to-admin?template=${template}`,
              templatePayload,
            )
          ).status,
          200,
        );
        const mail = (await state()).mail.at(-1);
        assert.equal(mail.subject.trim(), `runtime-fixture: ${subject}`);
        assert.match(mail.html, /runtime-fixture/);
        if (template === 'cluster-usage') {
          assert.match(mail.html, /37\.5%/);
          assert.match(mail.html, /alice~job/);
        } else {
          assert.match(
            mail.html,
            /job-detail\.html\?username=alice&jobName=job/,
          );
          assert.match(mail.html, /Runtime &lt;fixture&gt;/);
        }
      }
      assert.equal(
        (
          await post('send-email-to-admin', {
            ...payload,
            alerts: [{ ...firing, status: 'resolved' }],
          })
        ).status,
        200,
      );
      assert.match((await state()).mail.at(-1).subject, /RESOLVED: 1/);
    },
  );
  assert.equal(child.exitCode, null, output);
}

if (process.argv[2] === '--service') {
  service();
} else {
  require('node:test')(
    'alert-handler Node 24 integration',
    { timeout: 45000 },
    run,
  );
}
