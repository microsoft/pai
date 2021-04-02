// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const initialState = {
  currentTaskRole: 'taskrole',
  availableVirtualClusters: [],
  availableHivedSkuTypes: [],
};

export const JobExtraInfo = (state = initialState, action) => {
  switch (action.type) {
    case 'SAVE_CURRENT_TASKROLE':
      return {
        ...state,
        currentTaskRole: action.payload || 0,
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
