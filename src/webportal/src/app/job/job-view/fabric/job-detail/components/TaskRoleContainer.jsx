import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

function TaskRoleContainer({ children }) {
  return (
    <div
      className={c(t.mh1)}
      style={{ border: `4px solid #F4F4F4` }}
    >
      {children}
    </div>
  );
}

export default TaskRoleContainer;
