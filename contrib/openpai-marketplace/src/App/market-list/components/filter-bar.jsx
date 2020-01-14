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

import { isNil, isEmpty } from 'lodash';
import React, { useContext, useCallback } from 'react';
import {
  getTheme,
  ColorClassNames,
  CommandBarButton,
  SearchBox,
  Stack,
  FontWeights,
} from 'office-ui-fabric-react';

import FilterButton from './filter-button';
import Context from '../Context';
import Filter from '../Filter';

export const FilterBar = () => {
  const { spacing } = getTheme();

  const { itemList, filteredItems, filter, setFilter } = useContext(Context);

  const changeKeyword = useCallback(keyword => {
    const { authors, custom, official } = filter;
    setFilter(new Filter(keyword, authors, custom, official));
  });

  // get distinct authors from all
  var allAuthors = [];
  if (!isNil(itemList)) {
    allAuthors = itemList.map(item => {
      return item.author;
    });
  }
  const authorItems = Array.from(new Set(allAuthors));

  // delete all authors
  const clickCancel = useCallback(() => {
    const { keyword, custom, official } = filter;
    setFilter(new Filter(keyword, new Set(), custom, official));
  });

  return (
    <Stack>
      <Stack
        horizontal
        verticalAlign='stretch'
        horizontalAlign='space-between'
        styles={{
          root: [
            ColorClassNames.neutralLightBackground,
            {
              marginTop: spacing.s2,
              padding: spacing.m,
            },
          ],
        }}
      >
        <SearchBox
          underlined={true}
          placeholder='Search'
          styles={{
            root: {
              fontSize: 14,
              fontWeight: FontWeights.regular,
            },
          }}
          onChange={changeKeyword}
        />
        <Stack horizontal>
          <FilterButton
            styles={{ root: { backgroundColor: 'transparent' } }}
            text='Author'
            iconProps={{ iconName: 'Contact' }}
            items={authorItems}
            selectedItems={Array.from(filter.authors)}
            onSelect={authors => {
              const { keyword, custom, official } = filter;
              const authorsFilter = new Set(authors);
              setFilter(new Filter(keyword, authorsFilter, custom, official));
            }}
            searchBox
            clearButton
          />
          <CommandBarButton
            styles={{
              root: { backgroundColor: 'transparent', height: '100%' },
            }}
            iconProps={{ iconName: 'Cancel' }}
            onClick={clickCancel}
          />
        </Stack>
      </Stack>
      {!isNil(filteredItems) && !isEmpty(filteredItems) && (
        <Stack
          padding={spacing.s2}
          styles={{
            root: {
              fontSize: 14,
              fontWeight: FontWeights.regular,
            },
          }}>
          {filteredItems.length} results
        </Stack>
      )}
    </Stack>
  );
};
