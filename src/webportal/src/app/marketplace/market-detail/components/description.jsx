import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import 'github-markdown-css';

import Card from './card';
import Context from '../Context';

const Description = () => {
  const { marketItem } = useContext(Context);

  return (
    <Card className='markdown-body' style={{ paddingTop: 15, paddingLeft: 10 }}>
      <ReactMarkdown source={marketItem.description} />
    </Card>
  );
};

Description.propTypes = {
  content: PropTypes.string,
};

export default Description;
