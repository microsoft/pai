import React, { useState } from 'react';
import { Customizer, Stack } from 'office-ui-fabric-react';
import { FluentCustomizations } from '@uifabric/fluent-theme';
import { TabForm } from './TabForm';
import { initializeIcons } from '@uifabric/icons';
import { TabContent } from './TabFormContent';
import { JobTaskRole } from '../models/jobTaskRole';


initializeIcons();

const onContentChange = (dockerInfo) => {};

export const App = () => {
  const [jobTaskRole1, setJobTaskRole1] = useState(new JobTaskRole());
  const [jobTaskRole2, setJobTaskRole2] = useState(new JobTaskRole());
  const items = [{headerText: 'Task role 1',
                  content: 
                    <TabContent 
                      jobTaskRole={jobTaskRole1}
                      onContentChange={(dockerInfo)=>{ 
                        const jobTaskRole = new JobTaskRole();
                        jobTaskRole.dockerInfo = dockerInfo;
                        setJobTaskRole1(jobTaskRole);
                    }}/>},
                 {headerText: 'Task role 2',
                  content: 
                    <TabContent
                      jobTaskRole={jobTaskRole2}
                      onContentChange={(dockerInfo)=>{ 
                        const jobTaskRole = new JobTaskRole();
                        jobTaskRole.dockerInfo = dockerInfo;
                        setJobTaskRole2(jobTaskRole);
                    }}/>}];

  return (
    <Customizer {...FluentCustomizations}>
      <Stack horizontal>
        <Stack.Item grow={7} styles={{root: {maxWidth: '70%'}}}>
          <TabForm items={items} onItemAdd={()=>{return {headerText: 'Task role x', content: <TabContent jobTaskRole={new JobTaskRole()}></TabContent>}}} />
        </Stack.Item>
        <Stack.Item grow={3} disableShrink>
          Empty for something
        </Stack.Item>
      </Stack>
    </Customizer>
  );
}