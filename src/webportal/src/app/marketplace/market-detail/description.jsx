import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import ReactMarkdown from 'react-markdown';

import Card from './card';
import Context from './Context';

const Description = () => {

  const {jobInfo} = useContext(Context);
  console.log(jobInfo.description);

  const job_description = `### MINIST Example of OpenPAI Marketplace

  An example of MINIST model.
  
  #### Environments
  
  - Python 3.6
  - Tensorflow 1.12
  - Recommended docker image:  openpai/tensorflow-py36-cu90
  
  #### Steps
  
  - Download MINIST dataset:
  
  \`\`\`python
  python download.py
  \`\`\`
  
  - Classified with softmax regression:
  
  \`\`\`python
  python softmax_regression.py
  \`\`\`
  
  - Classified with convolution network:
  
  \`\`\`python
  python convolutional.py
  \`\`\`
  
  #### Reference
  
  - MNIST dataset: [link](http://yann.lecun.com/exdb/mnist/).`;

  /*
  function parse_md(md) {
    return md.replace("```", "\`\`\`");
  }
  */
 
  return (
    <Card>
      <ReactMarkdown source={jobInfo.description}/>
    </Card>
  );
};

Description.propTypes = {
    content: PropTypes.string,
};

Description.contextType = Context;

export default Description;