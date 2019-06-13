import React from 'react';
import {Label} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import MonacoEditor from '../../../app/components/monaco-editor';
import {isNil} from 'lodash';

export const MonacoTextFiled = (props) => {
  const {value, onChange, label, completionItems, monacoProps} = props;

  return (
    <div>
      { !isNil(label) && <Label>{label}</Label>}
      <MonacoEditor
        style={{flex: '1 1 100%', minHeight: 0, border: 'solid 1px rgb(194, 194, 194)', paddingTop: '6px', overflow: 'auto'}}
        completionItems={completionItems}
        monacoProps={{
          theme: 'vs',
          language: 'plaintext',
          options: {
            wordWrap: 'on',
            readOnly: false,
            theme: 'vs',
          },
          value: value,
          onChange: onChange,
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
};
