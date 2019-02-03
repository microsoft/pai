import classNames from "classnames";
import * as React from "react";

import { IFormControlProps } from ".";

interface INumberInputProps extends IFormControlProps<number> {
  min?: number;
  max?: number;
}

const NumberInput: React.FunctionComponent<INumberInputProps> = (props) => {
  const { children, className, max, min, onChange, value } = props;
  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (onChange !== undefined) { onChange(event.target.valueAsNumber); }
  };
  const UID = "U" + Math.floor(Math.random() * 0xFFFFFF).toString(16);

  return (
    <div className={classNames("form-group", className)}>
      <label htmlFor={UID}>{children}</label>
      <input type="number" className="form-control"
        id={UID} placeholder={children}
        min={min} max={max}
        value={value} onChange={onInputChange}/>
    </div>
  );
};

export default NumberInput;
