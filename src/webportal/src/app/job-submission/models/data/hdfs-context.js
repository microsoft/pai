import {createContext} from 'react';

// interface ContextType {
//   user: string
//   api: string
//   token: string
//   hdfsClient?: WebHDFSClient
// }

export const HdfsContext = createContext({
  user: '',
  api: '',
  token: '',
});
