import classNames from "classnames";
import * as React from "react";

import { IFormControlProps } from ".";

interface ICheckBoxProps extends IFormControlProps<boolean> {}

const CheckBox: React.FunctionComponent<ICheckBoxProps> = (props) => {
  const { children, className, onChange, value } = props;

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (onChange !== undefined) {
      onChange(event.target.checked);
    }
  };

  return (
    <div className={className}>
      <div className="checkbox">
        <label>
          <input type="checkbox" checked={value} onChange={onInputChange}/>
          {children ? " " + children : null}
        </label>
      </div>
    </div>
  );
};

export default CheckBox;
