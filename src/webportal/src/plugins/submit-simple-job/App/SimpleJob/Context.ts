import { createContext } from "react";

import SimpleJob, { ISimpleJob } from ".";

interface ISimpleJobContext {
  value: ISimpleJob;
  set: <F extends keyof ISimpleJob>(field: F) => (value: ISimpleJob[F]) => void;
}

const SimpleJobContext = createContext<ISimpleJobContext>({
  value: new SimpleJob(),
  set(field) { return (value) => { this.value[field] = value; }; },
});
SimpleJobContext.displayName = "SimpleJobContext";

export default SimpleJobContext;
