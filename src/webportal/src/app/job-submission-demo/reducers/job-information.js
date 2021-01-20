import { JobProtocol } from '../models/job-protocol';

const initialState = {
  jobProtocol: new JobProtocol({}),
  availableVirtualClusters: [],
  availableHivedSkuTypes: [],
};

export const jobInformation = (state = initialState, action) => {
  switch (action.type) {
    case 'SAVE_JOBPROTOCOL':
      return {
        ...state,
        jobProtocol:
          new JobProtocol({ ...state.jobProtocol, ...action.payload }) ||
          new JobProtocol({ ...state.jobProtocol }),
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
