import { createContext } from "react";

import { templates } from "./data.json";

interface ITemplatesContext {
  templates: typeof templates;
  apply(json: string): void;
}

const TemplatesContext = createContext<ITemplatesContext>({
  templates: [],
  apply() { return; },
});

export default TemplatesContext;
