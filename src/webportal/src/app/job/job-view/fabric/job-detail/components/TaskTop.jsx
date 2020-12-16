import React, { useCallback } from "react";
import c from "classnames";
import { isNil, get } from "lodash";
import { ComboBox, Link } from "office-ui-fabric-react";
import { FontClassNames, FontWeights, FontSizes } from "@uifabric/styling";

import t from "../../../../../components/tachyons.scss";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";
import { getHumanizedJobAttemptStateString, getAttemptDurationString } from "../../../../../components/util/job";
import utils from "../../../../../spark-debugging/models/utils/convert-utils";

function TaskTop(props) {
  const {
    jobInfo,
    attemptItems = [],
    onShowResourcePanel,
    selectedAttemptId = 0,
    onShowExitDiagnostics,
    resourceRelatedWarning,
    jobFullDetail,
    selectedVersion,
    attemptItemsFetchStatus,
    setJobDetailState,
    reloadAttempts,
  } = props;

  const links = [{ name: "View Exit Diagnostics" }, { name: "AM Logs" }];
  const comboboxRootStyles = {
    root: {
      width: 100,
    },
  };
  const items = [
    { name: "Status", data: getHumanizedJobAttemptStateString(jobInfo.jobStatus) },
    {
      name: "StartTime",
      data: utils.date("Y/m/d H:i:s", jobFullDetail.jobStatus.appLaunchedTime),
    },
    {
      name: "EndTime",
      data: (jobFullDetail.jobStatus.appCompletedTime === 0 ? 
        "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0" 
        : utils.date("Y/m/d H:i:s", jobFullDetail.jobStatus.appCompletedTime)),
    },
    {
      name: "Duration",
      data: getAttemptDurationString(jobFullDetail.jobStatus),
    },
  ];
  const items2 = [
    {
      name: "Allocated/Pending Containers",
      data: `${jobInfo.jobStatus.runningContianers} / ${jobInfo.jobStatus.pendingContaines}`,
    },
    {
      name: "Allocated/UtilizedVirtual GB",
      data:
        jobInfo.jobStatus.allocatedMB < 0
          ? "0/0"
          : `${(jobInfo.jobStatus.allocatedMB / 1024).toFixed(2)} / ${(
              jobInfo.jobStatus.utilizedMB / 1024
            ).toFixed(2)}`,
    },
    {
      name: "Allocated/Utilized VCores",
      data:
        jobInfo.jobStatus.allocatedVCores < 0
          ? "0/0"
          : `${
              jobInfo.jobStatus.allocatedVCores
            } / ${jobInfo.jobStatus.utilizedVCores.toFixed(2)}`,
    },
  ];

  const params = new URLSearchParams(window.location.search);
  const subCluster = params.get("subCluster");

  const renderElement = useCallback((item, index) => (
    <Item key={index} {...item} />
  ));

  const renderLink = useCallback((link, index) => (
    <React.Fragment key={index}>
      <Link
        styles={{ root: [FontClassNames.mediumPlus] }}
        target="_self"
        href={
          link.name === "AM Logs"
            ? `/logView.html?appId=${jobInfo.jobStatus.appId}&jobType=launcherAM&subCluster=${subCluster}`
            : "#"
        }
        disabled={isNil(jobInfo?.jobStatus?.appExitDiagnostics)}
        onClick={link.name === "AM Logs" ? (event) => {
          event.preventDefault();
          window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
        } : onShowExitDiagnostics}
      >
        {link.name}
      </Link>
      {index < links.length - 1 && <div className={c(t.bl, t.mh3, t.h1)}></div>}
    </React.Fragment>
  ));

  const handleAttemptIdChange = (e, option, index, value) => {
    const attemptId = Number(isNil(value) ? option.text : value).toString();
    if (
      selectedVersion !== jobInfo.jobStatus.version.toString() ||
      attemptId !== jobInfo.jobStatus.attemptId.toString()
    ) {
      setJobDetailState({
        selectedAttemptId: attemptId,
      });
    }
  };

  const handleFocusOnAttempt = () => {
    if (attemptItemsFetchStatus !== "UNFETCHED") return;
    reloadAttempts();
  };

  return (
    <header className={c("task-top", t.pt2, t.mt3, t.pb3, t.ph4, t.bgWhite)}>
      <section
        className={c(t.flex, t.itemsCenter, t.justifyEnd, t.mb2, t.mr2, t.pr1)}
      >
        {attemptItemsFetchStatus === "FETCHING" && (
          <Spinner className={c(t.mr1)} size={SpinnerSize.medium} />
        )}
        <span className={c(t.mr2)}>Attempt:</span>
        <ComboBox
          styles={comboboxRootStyles}
          options={attemptItems}
          text={selectedAttemptId}
          onChange={handleAttemptIdChange}
          onFocus={handleFocusOnAttempt}
          allowFreeform={true}
          autoComplete="off"
        />
      </section>
      <article className={c(t.flex)}>
        <section className={c()}>
          <div className={c(t.flex, t.itemsCenter, t.mb3)}>
            {items.map(renderElement)}
          </div>
          <div className={c(t.flex, t.itemsCenter)}>
            {links.map(renderLink)}
          </div>
        </section>
        <div className={c(t.bl, t.mh3, t.hAuto)}></div>
        <section className={c()}>
          <div className={c(t.flex, t.itemsCenter, t.mb3)}>
            {items2.map(renderElement)}
          </div>
          <Link
            styles={{ root: [FontClassNames.mediumPlus] }}
            href="#"
            onClick={onShowResourcePanel}
          >
            {resourceRelatedWarning && (
              <i
                className="fa fa-exclamation-triangle"
                style={{ color: "#FFA333", paddingRight: "8px" }}
              ></i>
            )}
            View Resource Request/Preemption Metrics
          </Link>
        </section>
      </article>
    </header>
  );
}

function Item({ name, data = "" }) {
  return (
    <div className={c(t.mr3)}>
      <span className={c(t.gray)}>{name}: </span>
      <span>{data}</span>
    </div>
  );
}

export default TaskTop;
