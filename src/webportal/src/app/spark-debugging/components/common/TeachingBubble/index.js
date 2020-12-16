import React, {  useState } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { TeachingBubble } from "office-ui-fabric-react/lib/TeachingBubble";

function index({ name, stage }) {
  const [isShow, setIsShow] = useState(false);

  return (
    <div className={c(t.ml1)}>
      <a
        className={c(t.pointer)}
        id="buttonId"
        onClick={() => setIsShow(!isShow)}
        style={{ color: "#0071bc", fontFamily: "segoe ui", fontSize: 15 }}
      >
        {name}
      </a>
      {isShow ? (
        <TeachingBubble
          target={"#buttonId"}
          hasCondensedHeadline={true}
          onDismiss={() => setIsShow(!isShow)}
          hasCloseIcon={true}
          closeButtonAriaLabel="Close"
          headline={stage.name}
          styles={{
            bodyContent: { padding: "1.1rem", backgroundColor: "#3C8DBC" },
          }}
        >
          <div style={{ fontSize: "10px", wordWrap: "break-word" }}>
            {name == "error" ? stage["failureReason"] : stage["error"]}
          </div>
        </TeachingBubble>
      ) : null}
    </div>
  );
}

export default index;
