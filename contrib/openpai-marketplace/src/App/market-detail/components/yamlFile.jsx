import React, { useContext } from 'react';
import { FontClassNames } from '@uifabric/styling';
import Context from '../Context';
import Card from './card';

const YamlFile = () => {
  const { marketItem } = useContext(Context);
  return (
    <Card
      style={{
        whiteSpace: 'pre-wrap',
        paddingTop: 15,
        paddingLeft: 10,
      }}
      className={FontClassNames.mediumPlus}
    >
      <div
        style={{
          backgroundColor: '#f8f8f8',
        }}
      >
        {marketItem.jobConfig}
      </div>
    </Card>
  );
};

export default YamlFile;
