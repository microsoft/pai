// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { JobProtocol as Protocol } from '../models/job-protocol';

const initialState = {
  jobProtocol: new Protocol({}),
};

export const JobProtocol = (state = initialState, action) => {
  switch (action.type) {
    case 'SAVE_JOBPROTOCOL':
      return {
        ...state,
        jobProtocol:
          new Protocol({ ...action.payload }) ||
          new Protocol({ ...state.jobProtocol }),
      };
    default:
      return state;
  }
};
