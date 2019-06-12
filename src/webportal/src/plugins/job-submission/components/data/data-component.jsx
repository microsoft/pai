import React from 'react';

import {BasicSection} from '../BasicSection';
import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';

export const DataComponent = (Props) => {
  return (
  <BasicSection sectionLabel='Data' sectionOptional>
    <TeamStorage />
    <CustomStorage />
  </BasicSection>
  );
};
