// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import c from 'classnames';
import PropTypes from 'prop-types';
import { isNil, isNumber } from 'lodash';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import loadable from '@loadable/component';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react';

import { monacoHack } from './monaco-hack.scss';
import t from './tachyons.scss';

const ReactMonacoEditor = loadable(() => import('react-monaco-editor'), {
  fallback: <Spinner size={SpinnerSize.large} />,
});

const MonacoEditor = ({
  className,
  style,
  monacoProps,
  completionItems,
  schemas,
  monacoRef,
}) => {
  // monaco variables
  const monaco = useRef(null);
  const editor = useRef(null);
  const completionList = useRef({
    suggestions: [],
  });

  // resize event
  const handleResize = () => {
    if (editor.current !== null) {
      editor.current.layout();
    }
  };
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // json schema
  const setSchemas = (monaco, schemas) => {
    if (isNil(schemas)) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas,
      });
    } else {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: false,
        schemas: [],
      });
    }
  };
  useLayoutEffect(() => {
    if (monaco.current !== null) {
      setSchemas(monaco.current, schemas);
    }
  }, [schemas]);

  // completion items
  useEffect(() => {
    if (completionItems) {
      completionList.current = {
        suggestions: completionItems.map(x => ({
          label: x,
          insertText: x,
        })),
      };
    }
  }, [completionItems]);

  let editorDidMountFunc = null;
  if (!isNil(monacoProps.editorDidMount)) {
    editorDidMountFunc = monacoProps.editorDidMount;
    delete monacoProps.editorDidMount;
  }

  let monacoClassName = null;
  if (!isNil(monacoProps.className)) {
    monacoClassName = monacoProps.className;
    delete monacoProps.className;
  }

  return (
    <div className={c(monacoHack, t.relative, className)} style={style}>
      <div
        style={{
          height: isNumber(monacoProps.height) ? monacoProps.height : null,
          width: isNumber(monacoProps.width) ? monacoProps.width : null,
        }}
      >
        <div className={c(t.absolute, t.absoluteFill)}>
          <ReactMonacoEditor
            // default props
            className={c(t.flexAuto, monacoClassName)}
            theme='vs-dark'
            language='text'
            // editor did mount
            editorDidMount={(e, m) => {
              // save monaco context
              editor.current = e;
              monaco.current = m;
              if (!isNil(monacoRef)) {
                monacoRef.current = m;
              }

              // completion provider
              for (const lang of ['json', 'yaml', 'plaintext', 'shell']) {
                monaco.current.languages.registerCompletionItemProvider(lang, {
                  provideCompletionItems() {
                    return completionList.current;
                  },
                });
              }
              // json schema
              setSchemas(monaco.current, schemas);
              if (editorDidMountFunc !== null) {
                editorDidMountFunc(e, m);
              }
            }}
            {...monacoProps}
          />
        </div>
      </div>
    </div>
  );
};

MonacoEditor.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  // monaco props
  monacoProps: PropTypes.object,
  schemas: PropTypes.array,
  completionItems: PropTypes.arrayOf(PropTypes.string),
  monacoRef: PropTypes.object,
};

export default MonacoEditor;
