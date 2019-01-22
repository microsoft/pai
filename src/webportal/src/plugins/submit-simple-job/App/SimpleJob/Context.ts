import { createContext } from "react";

import SimpleJob, { ISimpleJob } from ".";

interface ISimpleJobContext {
  value: SimpleJob;
  set: <F extends keyof ISimpleJob>(field: F) => (value: ISimpleJob[F]) => void;
  apply: (legacyJson: string) => void;
}

const SimpleJobContext = createContext<ISimpleJobContext>({
  value: new SimpleJob(),
  set() { return () => { return; }; },
  apply() { return; },
});
SimpleJobContext.displayName = "SimpleJobContext";

export default SimpleJobContext;
