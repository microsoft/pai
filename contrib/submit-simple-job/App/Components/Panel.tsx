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
            <span className={classNames("glyphicon", iconClassName)}></span>
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
