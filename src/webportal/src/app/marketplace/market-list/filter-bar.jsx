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

import { isNil } from 'lodash';
import React, { useContext, useState, useEffect } from 'react';
import {
  getTheme,
  ColorClassNames,
  CommandBar,
  CommandBarButton,
  SearchBox,
  Stack,
} from 'office-ui-fabric-react';

import FilterButton from './filter-button';
import Context from './Context';
import Filter from './Filter';

export const FilterBar = () => {
  const { spacing } = getTheme();

  const { filteredItems, filter, setFilter } = useContext(Context);

  function onKeywordChange(keyword) {
    const { authors, custom, official } = filter;
    setFilter(new Filter(keyword, authors, custom, official));
  }

  // get distinct authors
  var allAuthors = [];
  if (!isNil(filteredItems)) {
    allAuthors = filteredItems.map(item => {
      return item.author;
    });
  }
  const authorItems = Array.from(new Set(allAuthors));

  // get selected Author Items
  const selectedItems = Array.from(filter.authors);

  // delete all authors
  function onCancelClicked() {
    const { keyword, custom, official } = filter;
    setFilter(keyword, new Set(), custom, official);
  }

  return (
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
        onChange={onKeywordChange}
      />
      <Stack horizontal>
        <FilterButton
          styles={{ root: { backgroundColor: 'transparent' } }}
          text='Author'
          iconProps={{ iconName: 'Contact' }}
          items={authorItems}
          selectedItems={selectedItems}
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
          onClick={() => onCancelClicked}
        />
      </Stack>
    </Stack>
  );
};
