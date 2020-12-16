import React from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

function ProgressBarLayout({ styles, key, children }) {
  const { root = null, progressBar = null } = styles;
  const { className = "" } = progressBar;
  
  return (
    <div id={styles.wrap && styles.wrap.id} className={c(t.h100, t.w100)} style={styles.wrap}>
      <div
        key={key || 1}
        className={c(t.flex, "accordion", t.relative, t.truncate, t.mb1)}
        style={{
          height: "32px",
          // display: "inlineBlock",
          ...root,
        }}
      >
        <div
          className={c("progress-bar", t.absolute, t.h100, ...className)}
          role="progressbar"
          style={{
            fontSize: "14px",
            ...progressBar.root,
          }}
          aria-valuenow="25"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        {children}
      </div>
    </div>
  );
}

export default ProgressBarLayout;
