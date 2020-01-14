import React from 'react';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';

const TopBar = () => (
  <ActionButton
    iconProps={{ iconName: 'revToggleKey' }}
    href='/market-list.html'
  >
    Back to Marketplace
  </ActionButton>
);

export default TopBar;
