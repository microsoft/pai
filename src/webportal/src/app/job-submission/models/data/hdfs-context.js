import { createContext } from 'react';

export const HdfsContext = createContext({
  user: '',
  api: '',
  token: '',
});
