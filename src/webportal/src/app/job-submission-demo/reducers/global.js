import { SIDEBAR_PARAM, SIDEBAR_CONFIG } from '../utils/constants';

const initialState = {
  currentTabKey: 'ui',
  expandedFlag: false,
  currentSideKey: SIDEBAR_PARAM,
  currentSideList: SIDEBAR_CONFIG.map(item => ({
    ...item,
    checked: true,
  })),
};

export const global = (state = initialState, action) => {
  switch (action.type) {
    case 'TOGGLE_CURRENT_TAB':
      return {
        ...state,
        currentTabKey: action.payload || 'ui',
      };
    case 'TOGGLE_CURRENT_SIDEBAR':
      return {
        ...state,
        currentSideKey: action.payload || SIDEBAR_PARAM,
      };
    case 'TOGGLE_EXPANDED_FLAG':
      return {
        ...state,
        expandedFlag: action.payload || false,
      };
    case 'UPDATE_SIDEBAR_CONFIG':
      const currentSideList = action.payload || [];
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
