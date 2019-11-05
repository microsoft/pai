/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import * as http from 'http';
import { AddressInfo } from 'net';
import { ILoginInfo } from 'openpai-js-sdk';
import { stringify } from 'querystring';
import * as url from 'url';
import * as vscode from 'vscode';

import { __ } from '../common/i18n';

async function callback(reqUrl: url.Url): Promise<ILoginInfo> {
    let error: string | string[] | undefined;

    if (reqUrl && reqUrl.query && typeof(reqUrl.query) !== 'string') {
        error = reqUrl.query.error_description || reqUrl.query.error;

        if (!error) {
            return <ILoginInfo> <unknown>reqUrl.query;
        }
    }

    throw new Error(<string | undefined> error || 'No token received.');
}

function createServer(nonce: string): { server: http.Server, emitter: EventEmitter } {
    const emitter: EventEmitter = new EventEmitter();
    const callbackTimer: NodeJS.Timer =
        setTimeout(() => emitter.emit('callback', new Error('Timeout waiting for token')), 5 * 60 * 1000);

    const server: http.Server = http.createServer();
    server.on('request', async (req, res) => {
        const reqUrl: url.UrlWithParsedQuery = url.parse(req.url!, true);

        switch (reqUrl.pathname) {
            case '/signin':
                let receivedNonce: string = '';
                if (typeof(reqUrl.query.nonce) === 'string') {
                    receivedNonce = reqUrl.query.nonce.replace(/ /g, '+');
                }
                if (receivedNonce === nonce) {
                    emitter.emit('signin', { req, res });
                } else {
                    const err: Error = new Error('Nonce does not match.');
                    emitter.emit('signin', { err, res });
                }
                break;
            case '/callback':
                try {
                    const loginInfo: ILoginInfo = await callback(reqUrl);
                    emitter.emit('callback', { loginInfo, res });
                } catch (err) {
                    emitter.emit('callback', { err, res });
                }
                clearTimeout(callbackTimer);
                break;
            default:
                res.writeHead(404);
                res.end();
                break;
        }
    });

    return {
        server,
        emitter
    };
}

async function startServer(server: http.Server): Promise<number> {
    let portTimer: NodeJS.Timer;
    function cancelPortTimer(): void {
        clearTimeout(portTimer);
    }
    const port: Promise<number> = new Promise<number>((resolve, reject) => {
        portTimer = setTimeout(() => { reject(new Error('Timeout waiting for port')); }, 5000);
        server.on('listening', () => {
            resolve((<AddressInfo>server.address()).port);
        });
        server.on('error', err => {
            reject(err);
        });
        server.on('close', () => {
            reject(new Error('Closed'));
        });
        server.listen(0, '127.0.0.1');
    });
    port.then(cancelPortTimer, cancelPortTimer);
    return port;
}

function once(emitter: EventEmitter, name: string): Promise<any> {
    return new Promise(resolve => {
        emitter.once(name, resolve);
    });
}

export async function login(restServerUrl: string, webportalUrl: string, redirectTimeout: () => Promise<void>): Promise<any> {
    const nonce: string = crypto.randomBytes(16).toString('base64');
    const { server, emitter } = createServer(nonce);

    try {
        const port: number = await startServer(server);
        await vscode.env.openExternal(
            vscode.Uri.parse(`http://localhost:${port}/signin?nonce=${encodeURIComponent(nonce)}`));
        const redirectTimer: NodeJS.Timer =
            setTimeout(() => redirectTimeout().catch(console.error), 10 * 1000);

        const redirectReq: any = await once(emitter, 'signin');

        if ('err' in redirectReq) {
            const { err, res } = redirectReq;
            res.writeHead(302, { Location: `/?error=${encodeURIComponent(err && err.message || 'Unkown error')}` });
            res.end();
            throw err;
        }

        clearTimeout(redirectTimer);
        const host: any = redirectReq.req.headers.host || '';
        const updatedPortStr: string = (/^[^:]+:(\d+)$/.exec(Array.isArray(host) ? host[0] : host) || [])[1];
        const updatedPort: number = updatedPortStr ? parseInt(updatedPortStr, 10) : port;

        const signInUrl: string =
            `${restServerUrl}/api/v1/authn/oidc/login?` +
            `redirect_uri=${encodeURIComponent(`http://localhost:${updatedPort}/callback`)}`;

        redirectReq.res.writeHead(302, { Location: signInUrl });
        redirectReq.res.end();

        const loginRes: any = await once(emitter, 'callback');
        const response: any = loginRes.res;
        try {
            if ('err' in loginRes) {
                throw loginRes.err;
            }

            response.writeHead(302, { Location: `${webportalUrl}/index.html?${stringify(loginRes.loginInfo)}` });
            response.end();
            return loginRes.loginInfo;
        } catch (err) {
            response.writeHead(302, { Location: `/?error=${encodeURIComponent(err && err.message || 'Unkown error')}` });
            response.end();
            throw err;
        }
    } catch (err) {
        console.log(err);
    } finally {
        setTimeout(() => { server.close(); }, 5000);
    }
}
