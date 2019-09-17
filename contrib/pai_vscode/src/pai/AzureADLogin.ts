/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as crypto from 'crypto';
import * as http from 'http';
import { ILoginInfo } from 'openpai-js-sdk';
import * as url from 'url';
import * as vscode from 'vscode';

import { __ } from '../common/i18n';

interface IDeferred<T> {
    reject(reason: any): void;
    resolve(result: T | Promise<T>): void;
}

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

function createServer(nonce: string): any {
    type RedirectResult =
        { req: http.ServerRequest; res: http.ServerResponse; } | { err: any; res: http.ServerResponse; };
    let deferredRedirect: IDeferred<RedirectResult>;
    const redirectPromise: Promise<RedirectResult> =
        // tslint:disable-next-line: promise-must-complete
        new Promise<RedirectResult>((resolve, reject) => deferredRedirect = { resolve, reject });

    type AuthnResult = { loginInfo: ILoginInfo; res: http.ServerResponse; } | { err: any; res: http.ServerResponse; };
    let deferredCode: IDeferred<AuthnResult>;
    const loginInfoPromise: Promise<AuthnResult> =
    // tslint:disable-next-line: promise-must-complete
        new Promise<AuthnResult>((resolve, reject) => deferredCode = { resolve, reject });

    const codeTimer: NodeJS.Timer =
        setTimeout(() => deferredCode.reject(new Error('Timeout waiting for code')), 5 * 60 * 1000);
    function cancelCodeTimer(): void {
        clearTimeout(codeTimer);
    }

    const server: http.Server = http.createServer((req, res) => {
        const reqUrl: url.UrlWithParsedQuery = url.parse(req.url!, true);
        switch (reqUrl.pathname) {
            case '/signin':
                let receivedNonce: string = '';
                if (typeof(reqUrl.query.nonce) === 'string') {
                    receivedNonce = reqUrl.query.nonce.replace(/ /g, '+');
                }
                if (receivedNonce === nonce) {
                    deferredRedirect.resolve({ req, res });
                } else {
                    const err: Error = new Error('Nonce does not match.');
                    deferredRedirect.resolve({ err, res });
                }
                break;
            case '/callback':
                deferredCode.resolve(callback(reqUrl)
                    .then(loginInfo => ({ loginInfo, res }), err => ({ err, res })));
                break;
            default:
                res.writeHead(404);
                res.end();
                break;
        }
    });
    loginInfoPromise.then(cancelCodeTimer, cancelCodeTimer);
    return {
        server,
        redirectPromise,
        loginInfoPromise
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
            resolve(server.address().port);
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

export async function login(restServerUrl: string, redirectTimeout: () => Promise<void>): Promise<any> {

    const nonce: string = crypto.randomBytes(16).toString('base64');
    const { server, redirectPromise, loginInfoPromise } = createServer(nonce);

    try {
        const port: number = await startServer(server);
        await vscode.env.openExternal(
            vscode.Uri.parse(`http://localhost:${port}/signin?nonce=${encodeURIComponent(nonce)}`));
        const redirectTimer: NodeJS.Timer =
            setTimeout(() => redirectTimeout().catch(console.error), 10 * 1000);

        const redirectReq: any = await redirectPromise;
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
            `https://${restServerUrl}/api/v1/authn/oidc/login?` +
            `redirect_uri=${encodeURIComponent(`http://localhost:${updatedPort}/callback`)}`;

        try {
            redirectReq.res.writeHead(302, { Location: signInUrl });
        } catch (ex) {
            console.log(ex);
        }
        redirectReq.res.end();

        const loginRes: any = await loginInfoPromise;
        const response: any = loginRes.res;
        try {
            if ('err' in loginRes) {
                throw loginRes.err;
            }

            response.writeHead(302, { Location: '/' });
            response.end();
            return loginRes.loginInfo;
        } catch (err) {
            response.writeHead(302, { Location: `/?error=${encodeURIComponent(err && err.message || 'Unkown error')}` });
            response.end();
            throw err;
        }
    } finally {
        setTimeout(() => { server.close(); }, 5000);
    }
}