/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

export enum TreeDataType {
    Cluster = 0,
    Filter = 1,
    Job = 2,
    More = 3
}

export enum FilterType {
    Recent = 0,
    All = 1
}

export enum LoadingState {
    Finished = 0,
    Loading = 1,
    Error = 2
}
