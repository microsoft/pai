import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

import TaskTop from "./TaskTop";
import TaskRoleContainer from "./TaskRoleContainer";

function Task({ info, children }) {
  return (
    <div className={c(t.bgWhite, t.pb2)}>
      <TaskTop {...info} />
      <TaskRoleContainer>{children}</TaskRoleContainer>
    </div>
  );
}

export default Task;
