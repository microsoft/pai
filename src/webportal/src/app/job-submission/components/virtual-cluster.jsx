import React from 'react';
import {BasicSection} from './basic-section';
import {Dropdown} from 'office-ui-fabric-react';
import {FormShortSection} from './form-page';

export const VirtualCluster = () => {
  return (
    <BasicSection sectionLabel={'Virutual cluster'}>
      <FormShortSection>
        <Dropdown placeholder='Select an option'></Dropdown>
      </FormShortSection>
    </BasicSection>
  );
};
