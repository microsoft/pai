import React, { useCallback, useContext, useEffect, useState } from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { DefaultPalette, Stack, IStackStyles, IStackTokens, IStackItemStyles } from 'office-ui-fabric-react';
import { VirtualClusterContext } from "../Context";
import { Toggle } from "office-ui-fabric-react/lib/Toggle";
import { renderScrollPos } from "../common/renderComponent";
import SearchBar from "./SearchBar";
import NavComponents from "./NavComponent";
import { handleDom } from "../common/util";

function Menu() {
  const {
    setShouldNavigateByCluster,
    shouldNavigateByCluster,
    clusterNavList,
  } = useContext(VirtualClusterContext);
  const [searchVirtualCluster, setSearchVirtualCluster] = useState();

  useEffect(() => {
    if (clusterNavList && searchVirtualCluster) {
      const index = clusterNavList.findIndex(
        (vc) => vc[0].toLowerCase() === searchVirtualCluster.toLowerCase()
      );
      handleDomEvent(index);
    }
  }, [clusterNavList, searchVirtualCluster]);

  const handleDomEvent = useCallback((index) => {
    try {
      const nodes = document.querySelectorAll(
        "#content-wrapper .virtual-cluster .nav-container li"
      );
      const selecedLi = nodes[index];
      if (selecedLi != undefined) {
        handleDom(selecedLi, 'search');
        renderScrollPos(selecedLi);
      }
    } catch (error) {
      console.log("Unable to find node");
    }
  });

  const toggleOnChange = useCallback((e, checked) => {
    cookies.set("navigatedBySubCluster", checked, { expires: 7 });
    setShouldNavigateByCluster(checked);
  });

  return (
    <Stack verticalFill styles={{root: {width: "100%"}}}>
      <Stack.Item className={c(t.flex, t.justifyBetween, t.pr4)}>
        <Toggle
          label={
            shouldNavigateByCluster
              ? "Navigate by sub cluster"
              : "Navigate by virtual cluster"
          }
          checked={shouldNavigateByCluster}
          onText=""
          offText=""
          onChange={toggleOnChange}
        />
          <SearchBar
            setSearchVirtualCluster={setSearchVirtualCluster}
            searchVirtualCluster={searchVirtualCluster}
          />
      </Stack.Item>
      <Stack.Item
        className={c(t.overflowAuto, "menu-nav", t.bgWhite, t.mt1, t.h80, t.w100)}
      >
        <NavComponents />
      </Stack.Item>
    </Stack>
  );
}

export default Menu;
