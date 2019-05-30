import React  from 'react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { TextField} from 'office-ui-fabric-react';
import { getFromComponentsStyle } from './formStyle';
import PropTypes from 'prop-types';
import { BasicSection } from './BasicSection';

const formComponentsStyles = getFromComponentsStyle();

export const FormTextFiled = (props) => {
  const {label, onChange, value, textFiledProps, optional } = props;
  const textFieldId = getId('textField');

  return (
    <BasicSection label={label} optional={optional}>
      <TextField id={textFieldId}
                     styles={formComponentsStyles.textFiled}
                     value={value}
                     onChange={(_, value) => onChange(value)}
                     {...textFiledProps}/>
    </BasicSection>
  );
}

FormTextFiled.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  value: PropTypes.string,
  textFiledProps: PropTypes.object
};