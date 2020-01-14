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
import React, { useRef, useState, useMemo } from 'react';
import {
  CommandBarButton,
  Stack,
  ColorClassNames,
  getTheme,
  SearchBox,
} from 'office-ui-fabric-react';

const NO_RESULT_KEY = 'NO_RESULT';

const FilterButton = ({
  items,
  selectedItems,
  onSelect,
  searchBox,
  searchBoxText,
  clearButton,
  text,
  iconProps,
  styles,
}) => {
  const buttonRef = useRef();
  const set = useMemo(() => new Set(selectedItems), [selectedItems]);
  const [keyword, setKeyword] = useState('');
  const { spacing } = getTheme();

  // filter by keyword
  let menuItems = items
    .filter(name => name.startsWith(keyword || ''))
    .map(name => ({
      key: name,
      text: name,
      canCheck: true,
      checked: set.has(name),
      onClick: (e, item) => {
        e.preventDefault();
        const res = new Set(set);
        if (res.has(item.key)) {
          res.delete(item.key);
        } else {
          res.add(item.key);
        }
        onSelect(Array.from(res));
      },
    }));

  // no result placeholder
  if (menuItems.length === 0) {
    menuItems = [
      {
        key: NO_RESULT_KEY,
        text: '',
      },
    ];
  }

  return (
    <CommandBarButton
      componentRef={buttonRef}
      text={text}
      styles={styles}
      iconProps={iconProps}
      menuProps={{
        onDismiss: e => {
          if (e.type !== 'resize') {
            if (buttonRef.current) {
              buttonRef.current.dismissMenu();
            }
          }
        },
        onRenderMenuList: (props, defaultRenderer) => {
          let noResultFlag = false;
          if (
            props.items.length === 1 &&
            props.items[0].key === NO_RESULT_KEY
          ) {
            noResultFlag = true;
          }
          return (
            <Stack>
              {searchBox && (
                <div>
                  <div style={{ padding: spacing.s1, minWidth: 240 }}>
                    <SearchBox
                      styles={{
                        field: {
                          selectors: {
                            '::placeholder': {
                              fontStyle: 'italic',
                            },
                          },
                        },
                      }}
                      placeholder={searchBoxText || 'Filter'}
                      value={keyword}
                      onChanged={val => setKeyword(val)}
                    />
                  </div>
                  <hr
                    className={ColorClassNames.neutralLightBorder}
                    style={{ margin: 0 }}
                  />
                </div>
              )}
              {noResultFlag || (
                <div style={{ overflowY: 'auto', maxHeight: 300 }}>
                  {defaultRenderer(props)}
                </div>
              )}
              {clearButton && (
                <div>
                  {noResultFlag || (
                    <hr
                      className={ColorClassNames.neutralLightBorder}
                      style={{ margin: 0 }}
                    />
                  )}
                  {defaultRenderer({
                    hasCheckmarks: true,
                    items: [
                      {
                        key: 'clear-button',
                        text: 'Clear',
                        onClick: e => {
                          e.preventDefault();
                          onSelect([]);
                        },
                      },
                    ],
                  })}
                </div>
              )}
            </Stack>
          );
        },
        items: menuItems,
      }}
    >
      {selectedItems.length === 0 ? null : selectedItems.length === 1 ? (
        <strong>{selectedItems[0]}</strong>
      ) : (
        <strong>{`${selectedItems[0]} (+${selectedItems.length - 1})`}</strong>
      )}
    </CommandBarButton>
  );
};

FilterButton.propTypes = {
  // Filter props
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedItems: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired,
  searchBox: PropTypes.bool,
  searchBoxText: PropTypes.string,
  clearButton: PropTypes.bool,

  // Fabric Button's props
  styles: PropTypes.object,
  text: PropTypes.string,
  iconProps: PropTypes.object,
};

export default FilterButton;
