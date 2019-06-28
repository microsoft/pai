import {createContext} from 'react';

export const ErrorContext = createContext({
  hasError: false,
  setHasError: (error) => {},
  customListContainerPathError: [],
  setCustomListContainerPathError: [],
  customListDataSrouceError: [],
  setCustomListDataSourceError: [],
});
