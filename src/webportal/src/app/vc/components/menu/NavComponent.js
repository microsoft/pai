import React, {
  useCallback,
  useState,
  useContext,
  useLayoutEffect,
  useEffect,
  useReducer,
} from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import { Fabric } from "office-ui-fabric-react/lib/Fabric";
import { VirtualClusterContext } from "../Context";
import { handleDom, hoverEvent } from "../common/util";
import { renderScrollPos } from "../common/renderComponent";
import ProgressBarComponent from "../common/ProgressBarComponent/";
import { Icon, Link, FontSizes } from "office-ui-fabric-react";
import {
  usedOver,
  usedUnder,
  overCapacity,
  vcbg,
} from "../common/theme";
import "./index.css";

function NavComponents() {
  const {
    volumeStatistics,
    clusterNavList,
    parameters,
    setParametersCallback,
  } = useContext(VirtualClusterContext);
  const [prevV, setPrevV] = useState(0);

  useLayoutEffect(() => {
    if (clusterNavList) {
      const items = clusterNavList.map(([item, items], i) => {
        return {
          key: i,
          name: item,
          value: items,
          iconName: "Page",
        };
      });
      if (items.length > 0) {
        handleDomEvent(items);
        hoverEvent();
      }
    }
  }, [clusterNavList]);

  const handleDomEvent = useCallback((items) => {
    const { virtualCluster, subCluster } = parameters;
    const curItem =
      items.find((item) => item.name === virtualCluster) ||
      items.find((item) => item.name === subCluster);
    if (!curItem || curItem === undefined) return;
    let subIndexs = curItem.value.filter((s) => s);
    let subIndex = subIndexs.findIndex((s) => s === subCluster);
    if (subIndex < 0) {
      subIndex = subIndexs.findIndex((s) => s === virtualCluster);
    }
    const nodes = document.querySelectorAll(
      "#content-wrapper .virtual-cluster .nav-container li"
    );
    const selecedLi = nodes[curItem.key];
    const liLastChildren = selecedLi.lastChild;
    const childrens = liLastChildren.childNodes;
    if (childrens.length <= 0 || subIndex === -1) {
      return;
    } else {
      if (childrens[subIndex] != undefined) {
        const selecedNode = childrens[subIndex].firstChild;
        handleDom(selecedNode);
        renderScrollPos(selecedNode);
      }
    }
  });

  const onNavClick = useCallback((e, vc, s) => {
  const { navigateByCluster } = parameters;
    if (prevV === vc + s) return;
    const { target } = e;
    handleDom(target);
    navigateByCluster ?
    setParametersCallback(s, vc, -1)
    : 
    setParametersCallback(vc, s, -1);
    setPrevV(vc + s);
  });

  const computeProgressScale = useCallback(
    (resourcesConfigured, resourcesAllocated) => {
      return (resourcesAllocated / resourcesConfigured) * 100;
    }
  );

  const setProgressContainerWidth = useCallback((rc) => {
    return rc > 1000 ? 100 : rc >= 100 ? 80 : 50;
  });
  const setLabelAndWidth = useCallback((info) => {
    const { resourcesAllocated = 0, resourcesConfigured = 0 } = info;
    const progressContainerWidth = setProgressContainerWidth(
      resourcesConfigured
    );
    let scale = 0;
    if (resourcesAllocated <= 0) {
      scale = 0;
    } else if (resourcesAllocated > resourcesConfigured) {
      scale = 100;
    } else {
      scale = computeProgressScale(resourcesConfigured, resourcesAllocated);
    }
    return {
      label: resourcesAllocated + "/" + resourcesConfigured,
      scale,
      progressContainerWidth,
    };
  });

  const renderProgressBarDom = useCallback(
    ({ label = "", scale = 0, progressContainerWidth = 0 }, key) => {
      const barBG =
        scale >= 100 ? overCapacity : scale >= 80 ? usedOver : usedUnder;
      return (
        <ProgressBarComponent
          key={key}
          label={label}
          className={t.truncate}
          styles={{
            root: {
              backgroundColor: vcbg,
              width: progressContainerWidth,
              height: 12,
              color: "black",
              fontSize: FontSizes.mini,
              borderRadius: 10,
            },
            progressBar: {
              root: {
                backgroundColor: barBG,
                width: scale + "%",
              },
            },
            label: {
              justifyContent: "center",
            },
          }}
        />
      );
    }
  );

  const getTotalinfos = useCallback((index) => {
    const info = volumeStatistics[index][1];
    if (info.length <= 0) return { label: "", width: 0 };
    const computedInfo = setLabelAndWidth(info[0]);
    return renderProgressBarDom(computedInfo, index);
  });

  const getSingleinfo = useCallback((index, i) => {
    const infos = volumeStatistics[index][0];
    if (infos.length > 0 && i >= 0) {
      const info = infos[i];
      const computedInfo = setLabelAndWidth(info);
      return renderProgressBarDom(computedInfo, index + i);
    }
  });

  return (
    <Fabric>
      {
        <ul id="nav-container" className={c("nav-container", t.pl0)}>
          {clusterNavList &&
            clusterNavList.map((vc, index) => {
              return (
                <li
                  key={index}
                  className={c(
                    "nav-li",
                    t.pa1,
                    t.flex,
                    t.itemsCenter,
                    t.bb,
                    t.ml1,
                    t.fw4,
                    t.f6,
                    t.justifyContent
                  )}
                  style={{
                    width: "98.5%",
                    borderColor: "#F4F4F4",
                    color: "#B5B5B5",
                  }}
                >
                  <div id="nav-left" style={{minWidth: 190}}>
                    <div
                      id="vc"
                      className={c(t.flex, t.itemsCenter, t.pt1, t.pb1)}
                    >
                      {vc[2] && <Icon iconName="Flag" className={c(t.mr2)} />}
                      <div
                        className={c(t.darkGray, t.fw4, t.truncate)}
                        title={vc[0]}
                      >
                        {vc[0]}
                      </div>
                    </div>
                    <div>{getTotalinfos(index)}</div>
                  </div>
                  <div id="nav-right" style={{minWidth: 280}}>
                    {vc[1].map((s, i) => {
                      return (
                        <div
                          id="vc"
                          key={i}
                          className={c(
                            t.pt1,
                            t.pb1,
                            t.flex,
                            t.mr2,
                            t.itemsCenter,
                            t.justifyBetween
                          )}
                          style={{overflowWrap: "break-word"}}
                        >
                          <Link onClick={(e) => onNavClick(e, vc[0], s)}>
                            {s}
                          </Link>
                          <div className={c(t.black, t.fw4, t.f7, t.ml3)}>
                            {getSingleinfo(index, i)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </li>
              );
            })}
        </ul>
      }
    </Fabric>
  );
}

export default NavComponents;
