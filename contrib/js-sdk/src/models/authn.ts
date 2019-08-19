/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

/**
 * OpenPAI authn information.
 */
export interface IAuthnInfo {
    authn_type: string;
    loginURI: string;
    loginURIMethod: 'get' | 'post';
}

/**
 * OpenPAI authn basic login information.
 */
export interface ILoginInfo {
    admin: boolean;
    hasGitHubPAT: boolean;
    token: string;
    user: string;
}
