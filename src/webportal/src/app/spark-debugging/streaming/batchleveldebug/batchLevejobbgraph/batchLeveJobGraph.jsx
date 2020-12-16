import t from "tachyons-sass/tachyons.scss";
import c from "classnames";
import React from "react";

import JobGraphStatus from "./jobGraphStatus";
import JobGraphDetails from "./jobGraphDetails";
import scroll from "../../../components/jobgraph/zooming";
import AppData from "../../../components/common/appdata-context";
import { DefaultSpinner } from "../../../components/common/loading/loading";

export default class BatchLeveJobGraph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedJobId: props.selectedJobId,
      batchTimeId: props.batchTimeId,
      callbackChangeTab: props.callbackChangeTab,
      jobstatus: ["Succeeded", "Failed", "Running", "Pending", "Skipped"],
      jobs: [],
      loaded: true,
    };
    this.reload = this.reload.bind(this);
    this.filterJobs = this.filterJobs.bind(this);
    this.onRenderJobsScrollBar = this.onRenderJobsScrollBar.bind(this);
  }

  componentDidMount() {
    void this.reload();
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (
      this.props.selectedJobId !== prevProps.selectedJobId ||
      prevProps.batchTimeJobs != this.props.batchTimeJobs
    ) {
      this.filterJobs(this.props.selectedJobId);
    }
    //graph zomm
    if (this.state.jobs.length > 0) scroll();
    //render jobs scroll bar
    this.onRenderJobsScrollBar();
  }

  onRenderJobsScrollBar() {
    const jobs = $(".streaming-batchleveldebug #jobs");
    const jobGraphScrll = $(".streaming-batchleveldebug .job-graph-scrll");
    const jobsChilden = $(
      ".streaming-batchleveldebug #jobs .tachyons-flex--2m9FY"
    );
    const jobGraphChute = $(".streaming-batchleveldebug .job-graph-chute");
    jobGraphScrll.width(jobsChilden.width()).height(10);
    jobGraphChute.on("scroll", () =>
      jobs.scrollLeft(jobGraphChute.scrollLeft())
    );
    jobs.on("scroll", () => jobGraphChute.scrollLeft(jobs.scrollLeft()));
    if (jobs.height() > $(window).height()) jobs.css({ "overflow-x": "auto" });
  }

  reload() {
    this.filterJobs(this.props.selectedJobId);
  }

  filterJobs(selectedJobId) {
    const { batchTimeJobs } = this.props;
    try {
      if (batchTimeJobs && batchTimeJobs.length > 0) {
        this.setState({
          jobs:
            selectedJobId >= 0
              ? batchTimeJobs.filter((j) => j.jobId === selectedJobId)
              : batchTimeJobs,
        });
      }
      this.setState({ loaded: false });
    } catch (e) {
      console.log(e);
      return <div></div>;
    }
  }

  render() {
    const {
      jobs,
      jobstatus,
      callbackChangeTab,
      loaded,
      batchTimeId,
    } = this.state;

    return loaded ? (
      <DefaultSpinner />
    ) : (
      <div
        className={c("batchleveldebug-jobgraph", t.flex, t.flexColumn, t.mt4)}
      >
        <div className={c(t.flex, t.ml2)}>
          {!jobstatus
            ? ""
            : jobstatus.map((status, index) => (
                <JobGraphStatus status={status} index={index} key={index} />
              ))}
        </div>
        <div
          className={c("job-graph-chute", t.overflowAuto, t.mt3, t.mb1)}
          style={{ height: 10 }}
        >
          <div className="job-graph-scrll"></div>
        </div>
        <div
          id="jobs"
          className={c(t.flex, "jobs", t.pointer, t.overflowHidden)}
        >
          {!jobs || !jobs.length > 0 ? (
            <div>No jobs data of the batchTime</div>
          ) : (
            <div className={("all-job", t.flex)}>
              {jobs.map((job, index) => (
                <div key={index}>
                  {
                    <JobGraphDetails
                      key={index}
                      job={job}
                      jobId={job.jobId}
                      batchTimeId={batchTimeId}
                      callbackChangeTab={callbackChangeTab}
                      setLoaded={this.setState}
                    />
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

BatchLeveJobGraph.contextType = AppData;
