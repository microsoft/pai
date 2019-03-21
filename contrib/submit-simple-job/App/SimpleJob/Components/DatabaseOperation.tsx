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

import SimpleJob from "..";
import SimpleJobContext from "../Context";

const DatabaseOperation: React.FunctionComponent = () => (
  <SimpleJobContext.Consumer>
    { ({ value: simpleJob, apply }) => {
      const download = () => {
        const json = SimpleJob.toLegacyJSON(simpleJob);
        const blob = new Blob([json], { type: "application/octet-stream" });
        const filename = `${simpleJob.name}.json`;
        if (navigator.msSaveBlob) {
          navigator.msSaveBlob(blob, filename);
        } else {
          const anchor = document.createElement("a");
          anchor.href = URL.createObjectURL(blob);
          anchor.download = filename;
          document.body.appendChild(anchor);
          setTimeout(() => {
            anchor.click();
            setTimeout(() => {
              document.body.removeChild(anchor);
            }, 0);
          }, 0);
        }
      };
      const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.currentTarget.files == null) { return; }
        const file = event.currentTarget.files[0];
        if (file == null) { return; }

        const fileReader = new FileReader();
        fileReader.addEventListener("load", () => {
          apply(fileReader.result as string);
        });
        fileReader.readAsText(file);
      };
      return (
        <div className="col-md-12">
          <button type="button" className="btn btn-success" onClick={download}>
            Download JSON
          </button>
          {" "}
          <label>
            <a type="button" className="btn btn-success">Upload JSON</a>
            <input type="file" className="sr-only" accept="application/json,.json" onChange={upload}/>
          </label>
        </div>
      );
    }}
  </SimpleJobContext.Consumer>
);

export default DatabaseOperation;
