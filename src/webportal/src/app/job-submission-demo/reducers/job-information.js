// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { JobProtocol } from '../models/job-protocol';

const initialState = {
  jobProtocol: new JobProtocol({}),
  currentTaskRole: 'taskrole',
  availableVirtualClusters: [],
  availableHivedSkuTypes: [],
};

export const jobInformation = (state = initialState, action) => {
  switch (action.type) {
    case 'SAVE_JOBPROTOCOL':
      return {
        ...state,
        jobProtocol:
          new JobProtocol({ ...action.payload }) ||
          new JobProtocol({ ...state.jobProtocol }),
      };
    case 'SAVE_CURRENT_TASKROLE':
      return {
        ...state,
        currentTaskRole: action.payload || 'taskRole',
      };
    case 'SAVE_VIRTUAL_CLUSTERS':
      return {
        ...state,
        availableVirtualClusters: action.payload || [],
      };
    case 'SAVE_HIVEDSKUTYPES':
      return {
        ...state,
        availableHivedSkuTypes: action.payload || {},
      };
    default:
      return state;
  }
};
