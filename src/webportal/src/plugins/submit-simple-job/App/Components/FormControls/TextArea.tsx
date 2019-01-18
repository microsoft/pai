import classNames from "classnames";
import * as React from "react";

import { IFormControlProps } from ".";

interface ITextAreaProps extends IFormControlProps<string> {
  cols?: number;
  rows?: number;
}

const TextArea: React.FunctionComponent<ITextAreaProps> = (props) => {
  const { children, className, rows, cols, value, onChange } = props;
  const onTextAreaChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    if (onChange !== undefined) {
      onChange(event.target.value);
    }
  };
  const UID = "U" + Math.floor(Math.random() * 0xFFFFFF).toString(16);
  return (
    <div className={classNames("form-group", className)}>
      <label htmlFor={UID}>{children}</label>
      <textarea className="form-control" id={UID} placeholder={children}
        rows={rows} cols={cols}
        value={value} onChange={onTextAreaChange}
      />
    </div>
  );
};

export default TextArea;
