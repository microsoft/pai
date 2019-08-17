/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

/**
 * Utility class.
 */
class UtilClass {
    public fixUrl(url: string): string {
        if (!/^[a-zA-Z]+?\:\/\//.test(url)) {
            url = `http://${url}`;
        }
        return url;
    }
}

export const Util = new UtilClass();