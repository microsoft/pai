/*!
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as React from "react";

import SimpleJob, { ISimpleJob } from "./SimpleJob";
import SimpleJobContext from "./SimpleJob/Context";
import SimpleJobForm from "./SimpleJob/Form";

import TemplatesContext from "./Templates/Context";
import { templates } from "./Templates/data.json";

import convert from "./convert";

const AppContent: React.FunctionComponent = ({ children }) => (
  <div className="container-fluid">
    {children}
  </div>
);

interface IAppProps {
  api: string;
  user: string;
  token: string;
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
    const { setSimpleJob, applyLegacyJSON } = this;
    return (
      <SimpleJobContext.Provider value={{ value: simpleJob, set: setSimpleJob, apply: applyLegacyJSON }}>
        <TemplatesContext.Provider value={{ templates, apply: applyLegacyJSON }}>
          <AppContent>
            <SimpleJobForm onSubmit={this.submitSimpleJob}/>
          </AppContent>
        </TemplatesContext.Provider>
      </SimpleJobContext.Provider>
    );
  }

  private setSimpleJob = <
    F extends keyof ISimpleJob,
    V extends ISimpleJob[F],
  >(field: F) => (value: V) => {
    this.setState(({
      simpleJob,
    }) => ({
      simpleJob: simpleJob.clone(field, value),
    }));
  }

  private applyLegacyJSON = (json: string) => {
    this.setState({ simpleJob: SimpleJob.fromLegacyJSON(json) });
  }

  private submitSimpleJob = (simpleJob: SimpleJob) => {
    const { api, user, token } = this.props;
    const job = convert(simpleJob as SimpleJob, user);

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
