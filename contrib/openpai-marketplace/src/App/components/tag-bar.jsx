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
import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';
import { TextField, Stack, Icon, FontWeights } from 'office-ui-fabric-react';
import { FontClassNames, getTheme } from '@uifabric/styling';
import styled from 'styled-components';
import { isNil } from 'lodash';

const { spacing, palette } = getTheme();

const TagCard = styled.div`
  padding: ${spacing.s};
  background: ${palette.neutralLighter};
`;

export const TagBar = props => {
  const { tags, setTags } = props;
  const [editingTag, setEditingTag] = useState('');

  const deleteTagCliked = useCallback(tagToDelete => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  });

  const addTagCliked = useCallback(e => {
    // check empty
    if (editingTag === '') {
      return;
    }
    // check tag duplicates
    if (tags.includes(editingTag)) {
      alert('duplicated tags');
      setEditingTag('');
      return;
    }
    setTags([...tags, editingTag]);
    setEditingTag('');
  });

  return (
    <Stack horizontal gap='s1' verticalAlign='center'>
      {tags.map(tag => {
        return (
          <TagCard key={tag}>
            <Stack horizontal>
              <div
                className={FontClassNames.small}
                style={{
                  padding: spacing.s1,
                  fontSize: 14,
                  fontWeight: FontWeights.regular,
                }}
              >
                #{tag}
              </div>
              {!isNil(setTags) && (
                <button
                  onClick={() => deleteTagCliked(tag)}
                  style={{ border: 'none' }}
                >
                  <Icon iconName='Cancel' />
                </button>
              )}
            </Stack>
          </TagCard>
        );
      })}
      {!isNil(setTags) && (
        <Stack horizontal>
          <TextField
            value={editingTag}
            styles={{ fieldGroup: { width: 80 } }}
            onChange={e => {
              setEditingTag(e.target.value);
            }}
          />
          <button
            onClick={addTagCliked}
            style={{ backgroundColor: 'Transparent', border: 'none' }}
          >
            <Icon iconName='Add' />
          </button>
        </Stack>
      )}
    </Stack>
  );
};

TagBar.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  setTags: PropTypes.func,
};
