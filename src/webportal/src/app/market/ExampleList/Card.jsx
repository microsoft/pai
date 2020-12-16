import * as React from 'react';
import {
  DocumentCard,
  DocumentCardActivity,
  DocumentCardPreview,
  DocumentCardTitle,
  IDocumentCardPreviewProps
} from 'office-ui-fabric-react/lib/DocumentCard';
import { ImageFit } from 'office-ui-fabric-react/lib/Image';
import {Stack, StackItem} from 'office-ui-fabric-react/lib/Stack';
import {debounce, isEmpty, isNil} from 'lodash';

import {ColorClassNames, getTheme} from '@uifabric/styling';
import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {Overlay} from 'office-ui-fabric-react/lib/Overlay';
import { Text } from 'office-ui-fabric-react/lib/Text';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Shimmer, ShimmerElementType as ElemType } from 'office-ui-fabric-react/lib/Shimmer';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { VerticalDivider } from 'office-ui-fabric-react/lib/Divider';
import ExampleDetail from '../ExampleDetail';
import JobSubmit from '../../mt-job-submission/mt-job-submission';
import { Separator } from 'office-ui-fabric-react/lib/Separator';
import HTMLEllipsis from 'react-lines-ellipsis/lib/html'

const userAuth = require('../../user/user-auth/user-auth.component');

export default class Card extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            showExampleDetail: false,
            showModuleSubmit: false
        }
        this.setState = this.setState.bind(this);
        this.setShowModuleSubmit = this.setShowModuleSubmit.bind(this);
        this.props = props;
    }

    setShowModuleSubmit(value) {
        this.setState({showModuleSubmit: value});
    }

    render() {
        const {spacing} = getTheme();
        const theme = getTheme();
        return (
        <Stack verticalFill styles={{root: [
            ColorClassNames.whiteBackground,
            {width: 350, height: 300, marginLeft: spacing.l1, marginRight: spacing.l1, marginTop: spacing.l2, paddingBottom: spacing.m,
            boxSizing: "border-box", boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)", borderStyle: "1px solid rgba(0, 0, 0, 0.2)", borderRadius: "6px"},
          ]}}>
            <Stack verticalFill styles={{root:{paddingBottom:spacing.s1, width:350, height: 50, background: '#4A8EBE', borderTopRightRadius: "6px", borderTopLeftRadius: "6px"}}}>
              <StackItem styles={{root:{marginTop: spacing.s1, marginLeft: spacing.m, marginRight: spacing.m}}}>
                 <Text nowrap block variant={'large'} styles={{root:{color: 'white'}}} title={this.props.exampleData.info.name}>{this.props.exampleData.info.name}</Text>
               </StackItem>
            </Stack>
            <Stack verticalFill styles={{root:{height:150, width:350, paddingTop: spacing.m, paddingLeft: spacing.s1, paddingRight: spacing.s1}}}>
               <Stack horizontal>
                   <Stack styles={{root:{width:75, marginLeft:10, marginRight:5}}}><Text>{"Name:"}</Text></Stack>
                   <Stack styles={{root:{width:250}}}><Text nowrap title={`${this.props.exampleData.info.name}`}>{`${this.props.exampleData.info.name}`}</Text></Stack>
               </Stack>
               <Separator></Separator>
               <Stack horizontal>
                 <Stack styles={{root:{width:75, marginLeft:10, marginRight:5}}}><Text>{"Category:"}</Text></Stack>
                 <Stack styles={{root:{width:250}}}><Text nowrap title={`${this.props.exampleData.info.category}`}>{`${this.props.exampleData.info.category}`}</Text></Stack>
               </Stack>
               <Separator></Separator>
               <Stack horizontal>
                 <Stack styles={{root:{width:75, marginLeft:10, marginRight:5}}}><Text>{"Description:"}</Text></Stack>
                 <Stack styles={{root:{width:240}}}><div><HTMLEllipsis title={`${this.props.exampleData.info.description}`} unsafeHTML={`${this.props.exampleData.info.description}`} ellipsis='...' maxLine={2}/></div></Stack>
               </Stack>
               <Separator></Separator>
            </Stack>
            <Stack horizontal horizontalAlign="space-between" styles={{root:{ paddingTop: spacing.l2, marginLeft: spacing.l2, marginRight: spacing.l2, marginTop: spacing.l2}}}>
               <DefaultButton onClick={()=>{this.setState({showExampleDetail: true})}}>Detail</DefaultButton>
               <PrimaryButton onClick={()=>{this.setState({showModuleSubmit: true})}}>Submit</PrimaryButton>
            </Stack>
            {
                this.state.showExampleDetail?
                <Stack>
                    <ExampleDetail
                     setState={this.setState}
                     exampleData={this.props.exampleData}
                     moduleData={this.props.moduleData}
                     />
                </Stack>
                :
                null
            }
            {
                this.state.showModuleSubmit? 
                <Stack>
                <JobSubmit 
                    moduleMetadata={this.props.moduleData}
                    setShowJobSubmitPage={this.setShowModuleSubmit}
                    exampleData={this.props.exampleData}
                />
                </Stack>
                : null
            }
          </Stack>
        );
    }
}
