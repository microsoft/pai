// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useCallback, useMemo } from 'react';
import {
  Label,
  getTheme,
  DelayedRender,
  AnimationClassNames,
  FontSizes,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import MonacoEditor from '../../../components/monaco-editor';
import { isEmpty, isNil, debounce } from 'lodash';

export const MonacoTextField = props => {
  const {
    value,
    onChange,
    label,
    placeholder,
    completionItems,
    monacoProps: rawMonacoProps,
    monacoRef,
    errorMessage,
  } = props;
  const { palette, spacing, semanticColors } = getTheme();
  const borderColor = isEmpty(errorMessage)
    ? palette.neutralTertiary
    : semanticColors.errorText;

  const debouncedOnChange = useMemo(() => debounce(onChange, 100), [onChange]);
  const onChangeWrapper = useCallback(
    val => {
      if (val === placeholder) {
        return;
      }
      debouncedOnChange(val);
    },
    [debouncedOnChange],
  );

  const monacoProps = { ...rawMonacoProps };
  const rawEditorDidMount = monacoProps.editorDidMount;
  delete monacoProps.editorDidMount;
  const editorDidMountCallback = useCallback(
    (editor, monaco) => {
      editor.onDidFocusEditorText(() => {
        const value = editor.getValue();
        if (value === placeholder) {
          editor.setValue('');
        }
      });
      editor.onDidBlurEditorText(() => {
        const value = editor.getValue();
        if (isEmpty(value) && !isEmpty(placeholder)) {
          editor.setValue(placeholder);
        }
      });

      const value = editor.getValue();
      if (isEmpty(value) && !isEmpty(placeholder)) {
        editor.setValue(placeholder);
      }
      if (!isNil(rawEditorDidMount)) {
        rawEditorDidMount(editor, monaco);
      }
    },
    [rawEditorDidMount],
  );

  return (
    <div>
      {!isNil(label) && <Label>{label}</Label>}
      <MonacoEditor
        style={{
          flex: '1 1 100%',
          minHeight: 0,
          border: 'solid 1px',
          borderColor: borderColor,
          paddingTop: spacing.s1,
        }}
        completionItems={completionItems}
        monacoRef={monacoRef}
        monacoProps={{
          theme: 'vs',
          language: 'plaintext',
          options: {
            automaticLayout: true,
            wordWrap: 'on',
            readOnly: false,
            defaultEOL: 1,
            minimap: { enabled: false },
          },
          value: value,
          onChange: onChangeWrapper,
          editorDidMount: editorDidMountCallback,
          ...monacoProps,
        }}
      />
      {!isEmpty(errorMessage) && (
        <div role='alert'>
          <DelayedRender>
            <p
              className={AnimationClassNames.slideDownIn20}
              style={{
                fontSize: FontSizes.small,
                color: semanticColors.errorText,
                margin: 0,
                paddingTop: spacing.s2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span data-automation-id='error-message'>{errorMessage}</span>
            </p>
          </DelayedRender>
        </div>
      )}
    </div>
  );
};

MonacoTextField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  completionItems: PropTypes.array,
  monacoProps: PropTypes.object,
  monacoRef: PropTypes.object,
  errorMessage: PropTypes.string,
};
