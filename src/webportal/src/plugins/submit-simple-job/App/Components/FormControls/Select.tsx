import classNames from "classnames";
import * as React from "react";

import { IFormControlProps } from ".";

interface IOptionProps {
  label: string;
  value: string;
}

function Option({ value, label }: IOptionProps) {
  return <option value={value}>{label}</option>;
}

interface ISelectProps extends IFormControlProps<string> {
  options: Array<IOptionProps | string>;
}

const Select: React.FunctionComponent<ISelectProps> = (props) => {
  const { children, className, options, value, onChange } = props;
  const onSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    if (onChange !== undefined) {
      onChange(event.target.value);
    }
  };
  const UID = "U" + Math.floor(Math.random() * 0xFFFFFF).toString(16);
  return (
    <div className={classNames("form-group", className)}>
      <label htmlFor={UID}>{children}</label>
      <select className="form-control"
        id={UID} placeholder={children}
        value={value} onChange={onSelectChange}>
        {
          options.map((option) => {
            if (typeof option === "string") {
              return <Option key={option} label={option} value={option}/>;
            } else {
              return <Option key={option.value} {...option}/>;
            }
          })
        }
      </select>
    </div>
  );
};

export default Select;
