/*!
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import classNames from "classnames";
import * as React from "react";

import { IFormControlProps } from ".";

interface IOptionProps {
  label: string;
  value: string;
}

const Option: React.FunctionComponent<IOptionProps> = ({ value, label }) => {
  return <option value={value}>{label}</option>;
};

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
      <select
        className="form-control"
        id={UID}
        placeholder={children}
        value={value}
        onChange={onSelectChange}
      >
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
