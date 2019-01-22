/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as globalize from 'globalize';
import * as vscode from 'vscode';

globalize.load(require('../../i18n/cldr/likelySubtags.json')); // tslint:disable-line
globalize.load(require('../../i18n/cldr/plurals.json')); // tslint:disable-line
globalize.loadMessages(require('../../i18n/common.json')); // tslint:disable-line
globalize.locale(vscode.env.language.toLowerCase() === 'zh-cn' ? 'zh' : 'en');

export type I18nFormatFunction = typeof globalize.formatMessage;

export const __: I18nFormatFunction = (...args: any): string => {
    let result: string;
    try {
        result = globalize.formatMessage.apply(globalize, args);
    } catch {
        console.error('Missing translation for', args[0]);
        result = args[0];
    }

    return result;
};