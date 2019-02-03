import classNames from "classnames";
import * as React from "react";

import { IFormControlProps } from ".";

interface ITextInputProps extends IFormControlProps<string> {
  type?: string;
}

const TextInput: React.FunctionComponent<ITextInputProps> = (props) => {
  const { children, className, onChange, type = "text", value } = props;
  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (onChange !== undefined) { onChange(event.target.value); }
  };
  const UID = "U" + Math.floor(Math.random() * 0xFFFFFF).toString(16);

  return (
    <div className={classNames("form-group", className)}>
      <label htmlFor={UID}>{children}</label>
      <input type={type} className="form-control"
        id={UID} placeholder={children}
        value={value} onChange={onInputChange}/>
    </div>
  );
};

export default TextInput;
