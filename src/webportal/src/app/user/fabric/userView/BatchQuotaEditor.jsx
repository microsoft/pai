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

import React, { useRef, useContext, useState } from 'react';
import {
  Modal,
  FontClassNames,
  PrimaryButton,
  DefaultButton,
  Stack,
  StackItem,
  mergeStyles,
  getTheme,
  TextField,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import c from 'classnames';
import t from '../../../components/tachyons.scss';

import { updateUserQuotaRequest } from '../conn';
import { checkQuota } from '../utils';

import Context from './Context';

export default function BatchQuotaEditor({ isOpen = false, hide }) {
  const { showMessageBox, refreshAllUsers, getSelectedUsers } = useContext(
    Context,
  );

  const quotaRef = useRef(null);

  const [lock, setLock] = useState(false);
  const [needRefreshAllUsers, setNeedRefreshAllUsers] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setLock(true);

    const quota = quotaRef.current.value;
    const errorMessage = checkQuota(quota);
    if (errorMessage) {
      await showMessageBox(errorMessage);
      setLock(false);
      return;
    }

    const users = getSelectedUsers();
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const result = await updateUserQuotaRequest(
        user.username,
        Math.ceil(quota),
      )
        .then(() => {
          setNeedRefreshAllUsers(true);
          return { success: true };
        })
        .catch(err => {
          return { success: false, message: String(err) };
        });
      if (!result.success) {
        await showMessageBox(result.message);
        setLock(false);
        return;
      }
    }

    await showMessageBox('Update quota successfully');
    setLock(false);
    hide();
    refreshAllUsers();
  };

  const handleCancel = () => {
    hide();
    if (needRefreshAllUsers) {
      refreshAllUsers();
    }
  };

  const tdPaddingStyle = c(t.pa3);
  const tdLabelStyle = c(tdPaddingStyle, t.tr, t.vTop);

  const { spacing } = getTheme();

  return (
    <Modal
      isOpen={isOpen}
      isBlocking={true}
      containerClassName={mergeStyles({ width: '450px', minWidth: '450px' })}
    >
      <div className={c(t.pa4)}>
        <form onSubmit={handleSubmit}>
          <div className={c(FontClassNames.mediumPlus)}>Batch Edit Quotas</div>
          <div style={{ margin: `${spacing.l1} 0px` }}>
            <table className={c(t.mlAuto, t.mrAuto)}>
              <tbody>
                <tr>
                  <td className={tdLabelStyle}>Quota</td>
                  <td className={tdPaddingStyle} style={{ minWidth: '280px' }}>
                    <TextField
                      componentRef={quotaRef}
                      placeholder='Enter quota'
                      description='Change user quota'
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            style={{
              marginTop: spacing.l2,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <Stack horizontal={true} horizontalAlign='center' gap={spacing.s1}>
              <StackItem>
                <PrimaryButton type='submit' disabled={lock} autoFocus>
                  Save
                </PrimaryButton>
              </StackItem>
              <StackItem>
                <DefaultButton disabled={lock} onClick={handleCancel}>
                  Cancel
                </DefaultButton>
              </StackItem>
            </Stack>
          </div>
        </form>
      </div>
    </Modal>
  );
}

BatchQuotaEditor.propTypes = {
  isOpen: PropTypes.bool,
  hide: PropTypes.func,
};
