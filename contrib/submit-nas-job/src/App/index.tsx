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
import React, { useCallback, useEffect, useState } from "react";

import Context from "./Context";
import { usePromise, useValue } from "./hooks";
import Job from "./Job";

import { MountTestJobForm } from "./MountTestJob";
import { SimpleNASJobForm } from "./SimpleNASJob";
import { TensorflowDistributedJobForm } from "./TensorflowDistributedJob";
import { TensorflowSingleNodeJobForm } from "./TensorflowSingleNodeJob";

const EXTRAS_ID = "com.microsoft.submit-nas-job-plugin";

const TYPES = [{
  key: "mount-test-task",
  title: "Mount Test Task Template",
}, {
  key: "single-task",
  title: "Single Task Template",
}, {
  key: "tensorflow-single-task",
  title: "Tensorflow r1.4.0 (Single Task)",
}, {
  key: "tensorflow-distributed",
  title: "Tensorflow r1.4.0 (Distributed)",
}];

const defaultImage = "openpai/pai.build.base:hadoop2.7.2-cuda9.0-cudnn7-devel-ubuntu16.04";

interface IProps {
  pluginId?: string;

  api: string;
  user: string;
  token: string;

  originalJobName?: string;
  originalJobUser?: string;
}

export default function App({ pluginId, api, user, token, originalJobName, originalJobUser }: IProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [type, onTypeChanged, setType] = useValue("mount-test-task");
  const [name, onNameChanged, setName] = useValue(`unnamed-job-${Date.now()}`);
  const [image, onImageChanged, setImage] = useValue(defaultImage);
  const [virtualCluster, onVirtualClusterChanged, setVirtualCluster] = useValue("default");

  const [originalJob, originalJobError] = usePromise(() => {
    if (
      pluginId === undefined ||
      originalJobName === undefined ||
      originalJobUser === undefined
    ) {
      return Promise.resolve(null);
    }

    return fetch(`${api}/api/v1/user/${originalJobUser}/jobs/${originalJobName}/config`)
      .then((response) => {
        if (!response.ok) {
          throw Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        if (data.extras.submitFrom !== pluginId) {
          return null;
        }
        return JSON.parse(data.extras[EXTRAS_ID]);
      });
  }, []);

  const convert = useCallback(() => {
    if (job === null) { return {}; }
    const paiJob = job.convert();
    paiJob.extras = {
      submitFrom: pluginId,
      [EXTRAS_ID]: JSON.stringify(job),
    };
    return paiJob;
  }, [job, name]);

  const onSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (job === null) { return; }
    try {
      const jobObject = convert();
      window.fetch(`${api}/api/v1/user/${user}/jobs`, {
        body: JSON.stringify(jobObject),
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
          window.location.href = `/job-detail.html?username=${user}&jobName=${jobObject.jobName}`;
          return Promise.resolve();
        }
      }).catch((error) => {
        window.alert(error.message);
      });
    }  catch (e) {
      window.alert(e.message);
    }
  }, [job, name]);

  const onAdvancedClick = useCallback(() => {
    if (job === null) { return; }
    try {
      const jobObject = convert();
      window.sessionStorage.setItem("init-job", JSON.stringify(jobObject));
      window.location.href = "/submit.html?op=init";
    }  catch (e) {
      window.alert(e.message);
    }
  }, [job, name]);

  useEffect(() => {
    if (originalJob != null) {
      setType(originalJob.type);
      setImage(originalJob.image);
      setVirtualCluster(originalJob.virtualCluster);
    }
  }, [originalJob]);

  useEffect(() => {
    setName(`${type}-${Date.now().toString(36).toLocaleUpperCase()}`);
    switch (type) {
      case "mount-test-task":
        setImage("ubuntu:16.04");
        break;
      case "single-task":
        setImage("openpai/pai.build.base:hadoop2.7.2-cuda9.0-cudnn7-devel-ubuntu16.04");
        break;
      case "tensorflow-single-task":
      case "tensorflow-distributed":
        setImage("openpai/pai.example.tensorflow:stable");
        break;
    }
  }, [type]);

  if (originalJob === undefined && originalJobError === undefined) {
    return null;
  }

  let form = null;
  if (type === "mount-test-task") {
    form = (
      <MountTestJobForm
        name={name}
        image={image}
        virtualCluster={virtualCluster}
        defaultValue={originalJob}
        onChange={setJob}
      />);
  }
  if (type === "single-task") {
    form = (
      <SimpleNASJobForm
        name={name}
        image={image}
        virtualCluster={virtualCluster}
        defaultValue={originalJob}
        onChange={setJob}
      />);
  }
  if (type === "tensorflow-single-task") {
    form = (
      <TensorflowSingleNodeJobForm
        name={name}
        image={image}
        virtualCluster={virtualCluster}
        defaultValue={originalJob}
        onChange={setJob}
      />);
  }
  if (type === "tensorflow-distributed") {
  form = (
    <TensorflowDistributedJobForm
      name={name}
      image={image}
      virtualCluster={virtualCluster}
      defaultValue={originalJob}
      onChange={setJob}
    />);
  }

  return (
    <Context.Provider value={{ api, user, token }}>
      <div className="content">
        <form className="panel panel-primary" onSubmit={onSubmit}>
          <header className="panel-heading"><h2 style={{ margin: 0 }}>Submit Job</h2></header>
          <section className="panel-body">
            <div className="form-group">
              <label htmlFor="job-type">
                <span className="text-danger">*</span> Job Type
              </label>
              <select className="form-control" id="job-type" value={type} onChange={onTypeChanged}>
                {TYPES.map(({ key, title }) => <option key={key} value={key}>{title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="job-name">
                <span className="text-danger">*</span> Job Name
              </label>
              <input
                type="text"
                className="form-control"
                id="job-name"
                value={name}
                onChange={onNameChanged}
                required={true}
              />
            </div>
            <div className="form-group">
              <label htmlFor="job-image">
                <span className="text-danger">*</span> Job Image &emsp;
                <a
                  className="btn btn-link"
                  href="https://github.com/Microsoft/pai/blob/master/docs/user/training.md#learn-hello-word-job"
                  target="_blank"
                >
                  Learn More
                </a>
              </label>
              <input
                type="text"
                className="form-control"
                id="job-image"
                value={image}
                onChange={onImageChanged}
                required={true}
              />
            </div>
            <hr/>
            <div className="form-group">
              <label htmlFor="virtual-cluster">Virtual Cluster</label>
              <div className="row">
                <div className="col-sm-5">
                  <input
                    type="text"
                    className="form-control"
                    id="virtual-cluster"
                    value={virtualCluster}
                    onChange={onVirtualClusterChanged}
                    required={false}
                  />
                </div>
              </div>
              </div>
            <hr/>
            {form}
          </section>
          <footer className="panel-footer text-right">
            <button
              type="button"
              className="btn btn-default"
              disabled={job === null || job.mountDirectories === null}
              onClick={onAdvancedClick}
            >
              Advanced
            </button>
            {" "}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={job === null || job.mountDirectories === null}
            >
              Submit
            </button>
          </footer>
        </form>
      </div>
    </Context.Provider>
  );
}
