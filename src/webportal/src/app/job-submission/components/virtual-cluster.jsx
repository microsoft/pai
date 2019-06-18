import React, {useState, useEffect, useMemo, useCallback, useContext} from 'react';
import {BasicSection} from './basic-section';
import {Dropdown} from 'office-ui-fabric-react';
import {FormShortSection} from './form-page';
import Context from './Context';
import PropTypes from 'prop-types';

export const VirtualCluster = React.memo((props) => {
  const {onChange, virtualCluster} = props;
  const [vcIndex, setVcIndex] = useState(-1);

  const {vcNames} = useContext(Context);

  useEffect(() => {
    let index = options.findIndex((value)=> value.text === virtualCluster);
    if (index === vcIndex) {
      return;
    }
    setVcIndex(index);
  }), [virtualCluster];

  const options = useMemo(() => vcNames.map((vcName, index) => {
    return {
      key: `vc_${index}`,
      text: vcName,
    };
  }), [vcNames]);

  const _onChange = useCallback((_, item) => {
    if (onChange !== undefined) {
      onChange(item.text);
    }
  }, [onChange]);

  return (
    <BasicSection sectionLabel={'Virutual cluster'}>
      <FormShortSection>
        <Dropdown
          placeholder='Select an option'
          options={options}
          onChange={_onChange}
          selectedKey={vcIndex == -1 ? null : `vc_${vcIndex}`}
        />
      </FormShortSection>
    </BasicSection>
  );
});

VirtualCluster.propTypes = {
  onChange: PropTypes.func,
  virtualCluster: PropTypes.string,
};
