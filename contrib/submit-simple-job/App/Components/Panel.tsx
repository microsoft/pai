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

interface IPanelProps {
  className?: string;
  title: string;
}

interface IPanelState {
  collapse: boolean;
}

const headingStyle: React.CSSProperties = {
  cursor: "pointer",
  display: "block",
};

export default class Panel extends React.Component<IPanelProps, IPanelState> {
  constructor(props: IPanelProps) {
    super(props);
    this.state = { collapse: true };
  }

  public render() {
    const { children, className, title } = this.props;
    const { collapse } = this.state;
    const iconClassName = collapse ? "glyphicon-triangle-bottom" : "glyphicon-triangle-top";
    return (
      <div className={classNames("panel", "panel-default", className)}>
        <a className="panel-heading" style={headingStyle}>
          <p className="panel-title" onClick={this.onClickTitle}>
            <span className={classNames("glyphicon", iconClassName)}/>
            {" "}{title}
          </p>
        </a>
        <div className={classNames("panel-collapse", "collapse", { in: !collapse })}>
          <div className="panel-body rows">
            {children}
          </div>
        </div>
      </div>
    );
  }

  private onClickTitle = () => {
    this.setState(({ collapse }) => ({ collapse: !collapse }));
  }
}
