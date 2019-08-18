/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

/**
 * OpenPAI User Info.
 */
export interface IUserInfo {
    username?: string | null,
    grouplist?: string[] | null,
    email?: string | null,
    extension?: any | null,
    admin?: boolean,
    virtualCluster?: string[] | null
}