import React from 'react';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import t from 'tachyons-sass/tachyons.scss';
import c from 'classnames';

const StatusComponents = (props)=> {
    
    const {status, index} = props;
    const rootStyle = {
    color: {
            Running: '#0071BC',
            Succeeded: '#7FBA00',
            Failed: '#E81123',
            Skipped: '#B1B5B8',
            Pending: '#fff' 
        }[status]
    };

    return (
        <div className= {c(t.flex, t.mr3)} key= {index}>
            < Icon iconName= 'CheckboxFill'
                className= {c(t.mr2)}
                style= {rootStyle}
            />
            <span>{status}</span>
        </div>
    )
}

export default StatusComponents;