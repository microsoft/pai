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
    } }
  </SimpleJobContext.Consumer>
);

export default DatabaseOperation;
