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

import React from 'react';
import { PropTypes } from 'prop-types';

import { Modal, MessageBar, MessageBarButton } from 'office-ui-fabric-react';

import t from '../../../components/tachyons.scss';

function MessageBox(props) {
  const { text, onDismiss, confirm } = props;

  const closeModal = () => {
    if (onDismiss) onDismiss(!confirm);
  };

  const onClickOK = () => {
    if (onDismiss) onDismiss(true);
  };

  const onClickCancel = () => {
    if (onDismiss) onDismiss(false);
  };

  return (
    <Modal
      isOpen={true}
      onDismiss={closeModal}
      isBlocking={false}
      styles={{
        main: [
          { minWidth: '300px', maxWidth: '80vw' },
          t.flex,
          t.flexColumn,
          t.flexNowrap,
          t.itemsStretch,
        ],
      }}
    >
      <div>
        <MessageBar
          actions={
            <div>
              <MessageBarButton onClick={onClickOK}>OK</MessageBarButton>
              {confirm && (
                <MessageBarButton onClick={onClickCancel}>
                  Cancel
                </MessageBarButton>
              )}
            </div>
          }
        >
          <span className={t.pre}>{text}</span>
        </MessageBar>
      </div>
    </Modal>
  );
}

MessageBox.propTypes = {
  text: PropTypes.string,
  onDismiss: PropTypes.func,
  confirm: PropTypes.bool,
};

export default MessageBox;
