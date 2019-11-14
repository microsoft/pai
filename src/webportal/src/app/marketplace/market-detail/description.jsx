import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import 'github-markdown-css';

import Card from './card';
import Context from './Context';

const Description = () => {
  const { marketItem } = useContext(Context);

  return (
    <Card className='markdown-body' style={{ marginTop: 5, marginLeft: 10 }}>
      <div
        style={{
          backgroundColor: '#f8f8f8',
        }}
      >
        <ReactMarkdown source={marketItem.description} />
      </div>
    </Card>
  );
};

Description.propTypes = {
  content: PropTypes.string,
};

Description.contextType = Context;

export default Description;
