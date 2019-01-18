import * as React from "react";

import * as cookie from "js-cookie";

import SimpleJob, { ISimpleJob } from "./SimpleJob";
import SimpleJobContext from "./SimpleJob/Context";
import SimpleJobForm from "./SimpleJob/Form";

import convert from "./convert";

const AppContent: React.FunctionComponent = ({ children }) => (
  <div className="container-fluid">
    { children }
  </div>
);

interface IAppProps {
  api: string;
}

interface IAppState {
  simpleJob: SimpleJob;
}

export default class App extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props);

    this.state = {
      simpleJob: new SimpleJob(),
    };
  }

  public render() {
    const { simpleJob } = this.state;
    const { setSimpleJob } = this;
    return (
      <SimpleJobContext.Provider value={{ value: simpleJob, set: setSimpleJob }}>
        <AppContent>
          <SimpleJobForm onSubmit={this.submitSimpleJob}/>
        </AppContent>
      </SimpleJobContext.Provider>
    );
  }

  private setSimpleJob = <
    F extends keyof ISimpleJob,
    V extends ISimpleJob[F],
  >(field: F) => (value: V) => {
    this.setState(
      ({ simpleJob }) =>
        ({ simpleJob: simpleJob.set(field, value) }),
    );
  }

  private submitSimpleJob = (simpleJob: ISimpleJob) => {
    const { api } = this.props;
    const job = convert(simpleJob as SimpleJob);

    const user = cookie.get("user");
    const token = cookie.get("token");

    window.fetch(`${api}/api/v1/user/${user}/jobs`, {
      body: JSON.stringify(job),
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => {
      if (response.status >= 400) {
        return response.json().then((body) => {
          throw Error(body.message);
        });
      } else {
        window.location.href = `/view.html?username=${user}&jobName=${job.jobName}`;
        return Promise.resolve();
      }
    }).catch((error) => {
      window.alert(error.message);
    });
  }
}
