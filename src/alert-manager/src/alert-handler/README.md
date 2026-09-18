# Alert-handler runtime

The alert-handler uses Node.js 24.20.0 or a later Node 24 release. Its image is
`node:24.20.0-bookworm`; Node 10 is no longer supported by this service.
The Kubernetes client, mail renderer, HTTP dependencies, and their locked
versions are unchanged by the runtime migration. Their remaining security
updates are separate work.

Install with Yarn 1.22.22, keeping engine checks and lifecycle scripts enabled:

```sh
yarn install --frozen-lockfile --non-interactive
yarn lint
yarn test
```

Run these commands from this directory. The regression uses the real service
entrypoint, controllers, Kubernetes HTTP client, EJS renderer, and Nodemailer
stream transport. It substitutes loopback endpoints, an in-memory mail
transport, local template paths, and an ephemeral listening port in a child
process. It does not use a cluster, credentials, SMTP server, or database.

The image still starts `npm start` in production mode. Deployment configuration,
routes, JSON-only body parsing, bearer-token extraction, template names, and
environment variables remain unchanged. Image construction and deployed
cluster behavior require separate verification when permitted Docker access
and a disposable cluster are available.
