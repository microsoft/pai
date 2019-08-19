/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { AuthnClient } from '..';
import { IPAICluster } from '../models/cluster';
import { OpenPAIBaseClient } from './baseClient';
import { JobClient } from './jobClient';
import { UserClient} from './userClient';
import { VirtualClusterClient } from './virtualClusterClient';

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

    /**
     * OpenPAI Virtual Cluster Client.
     */
    public virtualCluster: VirtualClusterClient;

    /**
     * OpenPAI Authn Client.
     */
    public authn: AuthnClient;

    constructor(cluster: IPAICluster) {
        super(cluster);
        this.job = new JobClient(cluster);
        this.user = new UserClient(cluster);
        this.virtualCluster = new VirtualClusterClient(cluster);
        this.authn = new AuthnClient(cluster);
    }
}