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
import React, { useContext, useCallback } from 'react';
import { Stack, Text, Checkbox, FontWeights } from 'office-ui-fabric-react';

import Context from '../Context';
import Filter from '../Filter';

export const CategorySideBar = () => {
  const { filter, setFilter } = useContext(Context);

  const changeCustomCheckbox = useCallback((event, isChecked) => {
    const { keyword, authors, official } = filter;
    if (isChecked) {
      setFilter(new Filter(keyword, authors, true, official));
    } else {
      setFilter(new Filter(keyword, authors, false, official));
    }
  });

  const changeOfficialCheckbox = useCallback((event, isChecked) => {
    const { keyword, authors, custom } = filter;
    if (isChecked) {
      setFilter(new Filter(keyword, authors, custom, true));
    } else {
      setFilter(new Filter(keyword, authors, custom, false));
    }
  });

  return (
    <Stack gap='m'>
      <Text
        styles={{
          root: {
            fontSize: 16,
            fontWeight: FontWeights.semibold,
          },
        }}
      >
        Filter
      </Text>
      <Text
        styles={{
          root: {
            fontSize: 14,
            fontWeight: FontWeights.regular,
          },
        }}
      > Categories </Text>
      <Checkbox
        label='Custom'
        styles={{
          root: {
            fontSize: 14,
            fontWeight: FontWeights.regular,
          },
        }}
        onChange={changeCustomCheckbox}
      ></Checkbox>
      <Checkbox
        label='OpenPAI Official'
        styles={{
          root: {
            fontSize: 14,
            fontWeight: FontWeights.regular,
          },
        }}
        onChange={changeOfficialCheckbox}
      ></Checkbox>
    </Stack>
  );
};
