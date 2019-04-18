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

import {ColorClassNames} from '@uifabric/styling';
import c from 'classnames';
import {get, isNil} from 'lodash';
import {DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {Panel, PanelType} from 'office-ui-fabric-react/lib/Panel';
import PropTypes from 'prop-types';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';

import {monacoHack} from './monaco-hack.scss';
import t from '../../tachyons.css';

export default class MonacoPanel extends React.Component {
  constructor(props) {
    super(props);
    this.monaco = React.createRef();
    this.handleResize = this.handleResize.bind(this);
  }

  handleResize() {
    const editor = get(this.monaco, 'current.editor');
    if (!isNil(editor)) {
      editor.layout();
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  render() {
    const {isOpen, onDismiss, title, footerPrimaryButton, monacoProps} = this.props;
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
            content: [t.flex, t.flexAuto],
            scrollableContent: [t.flex, t.flexAuto],
            closeButton: [ColorClassNames.white, ColorClassNames.neutralQuaternaryHover],
          }}
        >
          <div className={c(t.flexAuto, t.flex, t.flexColumn)}>
            <div className={c(monacoHack)} style={{flex: '1 1 100%', minHeight: 0}}>
              {open && (
                <MonacoEditor
                  className={c(t.flexAuto)}
                  ref={this.monaco}
                  theme='vs-dark'
                  language='text'
                  options={{
                    wordWrap: 'on',
                    readOnly: true,
                  }}
                  {...monacoProps}
                />
              )}
            </div>
            <div className={c(t.mt4, t.flex, t.justifyBetween)}>
              <div>
                {footerPrimaryButton}
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
  }
}

MonacoPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  title: PropTypes.string,
  monacoProps: PropTypes.object,
  footerPrimaryButton: PropTypes.node,
};
