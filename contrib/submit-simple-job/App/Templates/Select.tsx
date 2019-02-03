import * as React from "react";

import TemplatesContext from "./Context";

import Select from "../Components/FormControls/Select";

interface ITemplatesSelectProps {
  className: string;
  children: string;
}

const TemplatesSelect: React.FunctionComponent<ITemplatesSelectProps> = ({ className, children }) => (
  <TemplatesContext.Consumer>
    { ({ templates, apply }) => {
      const options = templates.map(({
        Name,
        Json,
      }) => ({
        label: Name,
        value: Json,
      }));
      options.unshift({ label: "None", value: "" });

      const onChange = (value: string) => {
        if (value) { apply(value); }
      };

      return (
        <Select className={className} options={options} onChange={onChange}>
          {children}
        </Select>
      );
    } }
  </TemplatesContext.Consumer>
);

export default TemplatesSelect;
