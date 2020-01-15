/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
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

import React, { useState, useCallback, useContext } from 'react';
import { Stack, CommandButton, FontWeights } from 'office-ui-fabric-react';

import CreateMarketItem from './create-market-item';
import SuccessJobsDialog from '../../success-job-list/components/success-jobs-dialog';
import Context from '../Context';

export const TopBar = React.memo(() => {
  
  const { api, launcherType, jobHistory } = useContext(Context); 
  const [hideSuccessJobListDialog, setHideSuccessJobListDialog] = useState(
    true,
  );

  return (
    <Stack>
      <Stack horizontal horizontalAlign='begin'>
        <CommandButton
          text='Create'
          iconProps={{ iconName: 'Add' }}
          styles={{
            root: {
              fontSize: 14,
              fontWeight: FontWeights.regular,
            },
          }}
          onClick={e => {
            setHideSuccessJobListDialog(false);
          }}
        />
      </Stack>
      <SuccessJobsDialog
        hideDialog={hideSuccessJobListDialog}
        setHideDialog={setHideSuccessJobListDialog}
        api={api}
        launcherType={launcherType}
        jobHistory={jobHistory}
      />

      {/*<CreateMarketItem hideDialog={hideDialog} setHideDialog={setHideDialog} />*/}
    </Stack>
  );
});
