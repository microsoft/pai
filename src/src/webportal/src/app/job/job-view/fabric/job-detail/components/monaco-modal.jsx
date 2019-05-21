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

import {ColorClassNames, FontClassNames} from '@uifabric/styling';
import c from 'classnames';
import {IconButton} from 'office-ui-fabric-react/lib/Button';
import {Modal} from 'office-ui-fabric-react/lib/Modal';
import PropTypes from 'prop-types';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';

import {monacoHack} from './monaco-hack.scss';
import t from '../../../../../components/tachyons.scss';

const MonacoModal = ({isOpen, onDismiss, title, monacoProps}) => (
  <div>
    <Modal
      onDismiss={onDismiss}
      isBlocking={false}
      setInitialFocus={true}
      isOpen={isOpen}
    >
      <div className={t.overflowHidden}>
        {title && (
          <div className={c(t.pv2, t.ph4, t.flex, t.justifyBetween, t.itemsCenter, ColorClassNames.themeDarkAltBackground)}>
            <div className={c(
                ColorClassNames.white,
                FontClassNames.large,
                t.flexAuto,
            )}>
              {title}
            </div>
            <div>
              <IconButton
                styles={{icon: [ColorClassNames.white]}}
                iconProps={{iconName: 'Cancel'}}
                onClick={onDismiss}
              />
            </div>
          </div>
        )}
        <div className={monacoHack}>
          {open && (
            <MonacoEditor
              width={800}
              height={600}
              theme='vs'
              language='text'
              options={{
                wordWrap: 'on',
                readOnly: true,
              }}
              {...monacoProps}
            />
          )}
        </div>
      </div>
    </Modal>
  </div>
);

MonacoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  title: PropTypes.node,
  monacoProps: PropTypes.object,
};

export default MonacoModal;
