import React from 'react';
import {Label, getTheme} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import MonacoEditor from '../../components/monaco-editor';
import {isNil, debounce} from 'lodash';

export const MonacoTextFiled = (props) => {
  const {
    value,
    onChange,
    label,
    completionItems,
    monacoProps,
    monacoRef,
  } = props;
  const {palette, spacing} = getTheme();

  return (
    <div>
      {!isNil(label) && <Label>{label}</Label>}
      <MonacoEditor
        style={{
          flex: '1 1 100%',
          minHeight: 0,
          border: 'solid 1px',
          borderColor: palette.neutralTertiary,
          paddingTop: spacing.s1,
          overflow: 'auto',
        }}
        completionItems={completionItems}
        monacoRef={monacoRef}
        monacoProps={{
          theme: 'vs',
          language: 'plaintext',
          options: {
            wordWrap: 'on',
            readOnly: false,
            theme: 'vs',
            defaultEOL: 1,
          },
          value: value,
          onChange: debounce(onChange, 100),
          ...monacoProps,
        }}
      />
    </div>
  );
};

MonacoTextFiled.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  completionItems: PropTypes.array,
  monacoProps: PropTypes.object,
  monacoRef: PropTypes.object,
};
