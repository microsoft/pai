import React, { useState, useEffect } from "react";
import querystring from "querystring";
import { isEmpty } from "lodash";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

function Hyperlink(props) {
  const [querys, setQuerys] = useState();
  const [historical, setHistorical] = useState();
  const [yarnJavirsUri, setYarnJavirsUri] = useState();

  useEffect(() => {
    let _querys = querystring.parse(
      location.hash
        .split("#")
        .filter((q) => q)
        .join("&")
    );
    if (querys !== _querys) {
      setQuerys(_querys);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!isEmpty(querys)) {
      const subCluster = querys["subCluster"];
      const virtualCluster =
        Number(querys["vcName"]) === -1
          ? querys["virtualCluster"]
          : querys["vcName"];

      setYarnJavirsUri(
        `https://jarvis-west.dc.ad.msft.net/dashboard/mtp-prod/Overview/YARN?overrides=` +
          "[{%22query%22:%22//*[id=%27Queue%27]%22,%22key%22:%22value%22,%22replacement%22:%22" +
          virtualCluster +
          "%22}]%20"
      );
      setHistorical(`job-list.html?subCluster=${subCluster}`);

      // set cookies
      Number(virtualCluster) !== -1 &&
        cookies.set("virtualClusterUri", [virtualCluster], { expires: 7 });
      Number(subCluster) !== -1 &&
        cookies.set("subClusterUri", subCluster, { expires: 7 });
    }
  }, [querys]);

  return (
    !isEmpty(querys) && (
      <div className={c(t.pl3)}>
        <p className={c("historical")}>
          <a href={historical}>View Jobs</a>
        </p>
        <p class={c("historical", t.ma0)}>
          <a href={yarnJavirsUri} target="_blank">
            Historical Resource Usage
          </a>
        </p>
      </div>
    )
  );
}

export default Hyperlink;
