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
import {ColorClassNames, DefaultButton, Panel, PanelType} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React from 'react';

import MonacoEditor from './monaco-editor';

import t from './tachyons.scss';

const MonacoPanel = ({isOpen, onDismiss, title, header, footer, monacoProps, completionItems, schemas}) => {
  return (
    <div>
      <Panel
        onDismiss={onDismiss}
        isLightDismiss={true}
        isOpen={isOpen}
        type={PanelType.large}
        headerText={title}
        styles={{
          main: [ColorClassNames.neutralPrimaryBackground],
          headerText: [ColorClassNames.white],
          overlay: [ColorClassNames.blackTranslucent40Background],
          content: [t.flex, t.flexAuto, t.flexColumn],
          scrollableContent: [t.flex, t.flexAuto, {overflowY: 'visible'}],
          closeButton: [ColorClassNames.white, ColorClassNames.neutralQuaternaryHover],
        }}
      >
        {header && <div className={c(t.mb4, t.flex)}>
          {header}
        </div>}
        <div className={c(t.flexAuto, t.flex, t.flexColumn)}>
          <MonacoEditor
            style={{flex: '1 1 100%', minHeight: 0}}
            monacoProps={{
              theme: 'vs-dark',
              language: 'text',
              options: {
                wordWrap: 'on',
                readOnly: true,
              },
              ...monacoProps,
            }}
            completionItems={completionItems}
            schemas={schemas}
          />
          <div className={c(t.mt4, t.flex, t.justifyBetween)}>
            <div>
              {footer}
            </div>
            <DefaultButton
              text='Close'
              styles={{
                root: [ColorClassNames.neutralDarkBackground],
                rootHovered: [ColorClassNames.blackBackground],
                rootChecked: [ColorClassNames.blackBackground],
                rootPressed: [ColorClassNames.blackBackground],
                label: [ColorClassNames.white],
              }}
              onClick={onDismiss}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
};

MonacoPanel.propTypes = {
  // panel props
  isOpen: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  title: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
  // monaco props
  monacoProps: PropTypes.object,
  schemas: PropTypes.array,
  completionItems: PropTypes.arrayOf(PropTypes.string),
};

export default MonacoPanel;
