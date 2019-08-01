import React, { useMemo, useCallback, useContext } from 'react';
import { Dropdown } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { BasicSection } from './basic-section';
import { FormShortSection } from './form-page';
import Context from './context';

export const VirtualCluster = React.memo(props => {
  const { onChange, virtualCluster } = props;
  const { vcNames } = useContext(Context);

  const options = useMemo(
    () =>
      vcNames.map((vcName, index) => {
        return {
          key: `vc_${index}`,
          text: vcName,
        };
      }),
    [vcNames],
  );

  const _onChange = useCallback(
    (_, item) => {
      if (onChange !== undefined) {
        onChange(item.text);
      }
    },
    [onChange],
  );

  const vcIndex = options.findIndex(value => value.text === virtualCluster);
  return (
    <BasicSection sectionLabel='Virutual cluster'>
      <FormShortSection>
        <Dropdown
          placeholder='Select an option'
          options={options}
          onChange={_onChange}
          selectedKey={vcIndex === -1 ? null : `vc_${vcIndex}`}
        />
      </FormShortSection>
    </BasicSection>
  );
});

VirtualCluster.propTypes = {
  onChange: PropTypes.func,
  virtualCluster: PropTypes.string,
};
