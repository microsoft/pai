/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { UserClient } from '..';
import { IPAICluster } from '../models/cluster';
import { OpenPAIBaseClient } from './baseClient';
import { JobClient } from './jobClient';

/**
 * OpenPAI Client.
 */
export class OpenPAIClient extends OpenPAIBaseClient {
    /**
     * OpenPAI Job Client.
     */
    public job: JobClient;

    /**
     * OpenPAI User Client.
     */
    public user: UserClient;

    constructor(cluster: IPAICluster) {
        super(cluster);
        this.job = new JobClient(cluster);
        this.user = new UserClient(cluster);
    }
}