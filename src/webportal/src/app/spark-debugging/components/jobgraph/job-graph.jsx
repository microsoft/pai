import t from 'tachyons-sass/tachyons.scss';
import c from 'classnames';
import React from 'react';

import StatusComponents from './job-status';
import JobDetails from './job-details';
import scroll from './zooming';
import AppData from '../common/appdata-context';
import { SpinnerLoading } from '../../../components/loading';

export default class JobGraph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedJobId: props.selectedJobId,
            callbackChangeTab: props.callbackChangeTab,
            jobstatus: ['Succeeded', 'Failed', 'Running', 'Pending', 'Skipped'],
            jobs: [],
            loaded: false,
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
        if (this.props.selectedJobId !== prevProps.selectedJobId) {
            this.filterJobs(this.props.selectedJobId);
        };
        //graph zomm
        if(this.state.jobs.length > 0) scroll();
        //render jobs scroll bar
        this.onRenderJobsScrollBar();
    }

    onRenderJobsScrollBar() {
        const jobs = $('.spark #jobs');
        const jobGraphScrll = $('.spark .job-graph-scrll');
        const jobsChilden = $('.spark #jobs .tachyons-flex--2m9FY');
        const jobGraphChute = $('.spark .job-graph-chute');
        jobGraphScrll.width(jobsChilden.width()).height(10);
        jobGraphChute.on('scroll', ()=> jobs.scrollLeft(jobGraphChute.scrollLeft()));
        jobs.on('scroll', ()=> jobGraphChute.scrollLeft(jobs.scrollLeft()));
        if((jobs.height()) > $(window).height()) jobs.css({'overflow-x': 'auto'});
    }
    
    reload() {
        this.filterJobs(this.state.selectedJobId);
        this.setState({
            loaded: true
        });
    }

    filterJobs(selectedJobId) {
        const { appData } = this.context;
        try {
            if (appData && appData.jobs) {
                this.setState({
                    jobs: selectedJobId >= 0 ? appData.jobs.filter(j => j.jobId === selectedJobId) : appData.jobs,
                });
            }
        }
        catch (e) {
            console.log(e);
            return <div>Get error when fetch job data from Spark history server</div>
        }
    }
    
    render() {
        const { jobs, jobstatus, callbackChangeTab, loaded } = this.state;
        const { appData } = this.context;
        
        return (
            <div className={c(t.flex, t.flexColumn, t.mt4)}>
                <div className={c(t.flex, t.ml2)}>
                    {!jobstatus ? '' : jobstatus.map((status, index) => < StatusComponents status={status} index={index} key={index} />)}
                </div>
                <div className={c('job-graph-chute', t.overflowAuto, t.mt3, t.mb1)} style={{ height: 10 }}>
                    <div className='job-graph-scrll'></div>
                </div>
                <div id='jobs' className={c(t.flex, 'jobs', t.pointer, t.overflowHidden)} style={{backgroundColor: '#ECF0F5'}}>
                    {!loaded ? <SpinnerLoading /> :
                            !jobs || jobs.length <= 0 ?
                                <div>No stage data of the job.</div> :
                                <div className={'all-job', t.flex}>
                                    {jobs.map((job, index) =>
                                        <div key={index}>
                                            {<JobDetails
                                                key={index}
                                                job={job}
                                                jobId={job.jobId}
                                                callbackChangeTab={callbackChangeTab} />}
                                        </div>)}
                                </div>}
                </div>
            </div>
        )
    }
}

JobGraph.contextType = AppData;
