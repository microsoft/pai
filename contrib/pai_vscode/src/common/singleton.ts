/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import 'reflect-metadata'; // tslint:disable-line

import { injectable, Container } from 'inversify';
import * as vscode from 'vscode';

import { __ } from './i18n';

export const container: Container = new Container({ autoBindInjectable: true, defaultScope: 'Singleton' });
export const EXTENSION_CONTEXT: symbol = Symbol('vscode.ExtensionContext');

type Constructor<T> = new(...arg: any[]) => T;

/**
 * Singleton base class.
 * Please implement constructor as simple as possible - only for injecting required components.
 * Most initialization logic (including async initialization) should occur in onActivate.
 */
@injectable()
export abstract class Singleton {
    protected context: vscode.ExtensionContext = container.get(EXTENSION_CONTEXT);
    private activated: boolean = false;

    constructor() {
        console.log(`Singleton ${this.constructor.name} constructed`);
        container.bind(Singleton).toConstantValue(this);
    }

    public onActivate?(): Promise<void> | void;
    public onDeactivate?(): Promise<void> | void;

    public async ensureActivated(): Promise<this> {
        if (this.onActivate && !this.activated) {
            this.activated = true;
            await this.onActivate();
            console.log(`Singleton ${this.constructor.name} activated`);
        }
        return this;
    }
}

let getSingletonDisabled: boolean = false;
let initializationFinish: boolean = false;

export function getSingleton<T extends Singleton>(clazz: Constructor<T>): Promise<T> | T {
    if (!container.isBound(clazz)) {
        container.bind(clazz).toSelf();
    }
    if (getSingletonDisabled) {
        throw new Error('Getting async initialized Singleton in Singleton constructor is prohibited!');
    }
    return container.get<T>(clazz).ensureActivated();
}

export function bindExtensionContext(context: vscode.ExtensionContext): void {
    container.bind(EXTENSION_CONTEXT).toConstantValue(context);
}

export async function initializeAll(singletonClasses: Constructor<Singleton>[]): Promise<void> {
    getSingletonDisabled = true;
    const allSingletons: Singleton[] = singletonClasses.map(clazz => container.get(clazz));
    getSingletonDisabled = false;
    await Promise.all(allSingletons.map(singleton => singleton.ensureActivated()));
    initializationFinish = true;
}

export async function waitForAllSingletonFinish(): Promise<void> {
    while (!initializationFinish) {
        await delay(10);
    }
}

export async function delay(ms: number): Promise<void> {
    // tslint:disable-next-line: no-unnecessary-callback-wrapper
    await new Promise((something) => setTimeout(() => something(), ms));
}

export async function dispose(): Promise<void> {
    for (const singleton of container.getAll(Singleton)) {
        if (singleton.onDeactivate) {
            await singleton.onDeactivate();
        }
    }
}