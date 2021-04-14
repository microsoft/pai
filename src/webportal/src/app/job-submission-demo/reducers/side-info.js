// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SIDEBAR_CONFIG, SIDEBAR_TOOL } from '../utils/constants';

const initialState = {
  expandedFlag: true,
  currentSideKey: SIDEBAR_TOOL,
  currentSideList: SIDEBAR_CONFIG.map(item => ({
    ...item,
    checked: true,
  })),
};

export const SideInfo = (state = initialState, action) => {
  let currentSideList = [];
  switch (action.type) {
    case 'TOGGLE_EXPANDED_FLAG':
      return {
        ...state,
        expandedFlag: action.payload || true,
      };
    case 'TOGGLE_CURRENT_SIDEBAR':
      return {
        ...state,
        currentSideKey: action.payload || SIDEBAR_TOOL,
      };
    case 'UPDATE_SIDEBAR_CONFIG':
      currentSideList = action.payload || [];
      if (state.currentSideKey) {
        const currentSideItem = currentSideList.find(
          item => item.key === state.currentSideKey,
        );
        const isCurrentChecked = currentSideItem.checked;
        return {
          ...state,
          currentSideList,
          ...(!isCurrentChecked ? { currentSideKey: null } : null),
        };
      } else {
        return {
          ...state,
          currentSideList,
        };
      }
    default:
      return state;
  }
};
