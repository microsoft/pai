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

import {
  elementContains,
  Callout,
  TextField,
  DirectionalHint,
  getTheme,
  CommandButton,
  ColorClassNames,
  KeyCodes,
} from 'office-ui-fabric-react';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';

function getSpacingValue(unitString) {
  const numericalPart = parseFloat(unitString);
  if (isNaN(numericalPart)) {
    return 0;
  }
  const unitPart = unitString.substring(numericalPart.toString().length).trim();
  if (!isEmpty(unitPart) && unitPart !== 'px') {
    throw new Error(`AutoComplete's gap only support 'px' unit`);
  }
  return numericalPart;
}

export const AutoComplete = ({
  items,
  value,
  onChange,
  showAllSuggestions,
}) => {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggested, setSuggested] = useState(0);
  const root = useRef();
  const input = useRef();
  // get callout's gap space
  const { spacing } = getTheme();
  const gap = useMemo(() => getSpacingValue(spacing.s1), [spacing]);
  // suggestions
  useEffect(() => {
    const suggestions = showAllSuggestions
      ? items
      : items.sort().filter(x => x.startsWith(value) && x !== value);
    setSuggestions(suggestions);
    if (suggested >= suggestions.length) {
      setSuggested(Math.max(0, suggestions.length - 1));
    }
  }, [value, items, showAllSuggestions]);
  // event handler
  const onTextChange = useCallback(
    (e, newValue) => {
      onChange(newValue || '');
    },
    [items, onChange],
  );

  const onFocus = useCallback(() => setFocused(true), []);

  const onBlur = useCallback(e => {
    const relatedTarget = e.relatedTarget || document.activeElement;
    if (relatedTarget && !elementContains(root.current, relatedTarget)) {
      setFocused(false);
    }
  }, []);

  const onSelect = idx => {
    if (isEmpty(suggestions)) {
      return;
    }
    onChange(suggestions[idx]);
    input.current && input.current.focus();
    setSuggested(0);
  };

  const onKeyDown = e => {
    const keyCode = e.which;
    switch (keyCode) {
      case KeyCodes.tab:
      case KeyCodes.enter:
        onSelect(suggested);
        e.preventDefault();
        e.stopPropagation();
        break;
      case KeyCodes.up:
        if (suggested > 0) {
          setSuggested(suggested - 1);
        }
        e.preventDefault();
        e.stopPropagation();
        break;
      case KeyCodes.down:
        if (suggested < suggestions.length - 1) {
          setSuggested(suggested + 1);
        }
        e.preventDefault();
        e.stopPropagation();
        break;
    }
  };

  return (
    <div ref={root}>
      <TextField
        componentRef={input}
        value={value}
        onChange={onTextChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <Callout
        target={root.current}
        hidden={!focused || isEmpty(suggestions)}
        directionalHint={DirectionalHint.topLeftEdge}
        isBeakVisible={false}
        gapSpace={gap}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      >
        {suggestions.map((x, idx) => (
          <div key={`suggestion-${x}`}>
            <CommandButton
              styles={{
                root: [
                  { minWidth: '260px' },
                  ColorClassNames.neutralLighterBackgroundHover,
                  suggested === idx && ColorClassNames.neutralLightBackground,
                  suggested === idx &&
                    ColorClassNames.neutralTertiaryAltBackgroundHover,
                ],
                rootHovered: [ColorClassNames.neutralDarkHover],
              }}
              onClick={() => onSelect(idx)}
            >
              {x}
            </CommandButton>
          </div>
        ))}
      </Callout>
    </div>
  );
};

AutoComplete.defaultProps = {
  items: [],
};

AutoComplete.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  showAllSuggestions: PropTypes.bool,
};

export default AutoComplete;
