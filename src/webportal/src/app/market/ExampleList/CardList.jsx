// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import * as querystring from 'querystring';
import c from 'classnames';
import t from '../../components/tachyons.scss';

import {FontClassNames, Icon, FontSizes, FontWeights} from 'office-ui-fabric-react';
import React, {useState, useContext, useMemo, useCallback, useEffect, useRef} from 'react';
import {Stack} from 'office-ui-fabric-react/lib/Stack';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import {getTheme, ColorClassNames} from '@uifabric/styling';
import { ScrollablePane } from 'office-ui-fabric-react/lib/ScrollablePane';
import Card from './Card';
import { Shimmer, ShimmerElementType as ElemType } from 'office-ui-fabric-react/lib/Shimmer';
import Context from './Context';
import {isNil} from 'lodash';

export default function CardList() {

    const {filteredExamples, moduleDict, filter, setFilter} = useContext(Context);
    const [loading, setLoading] = useState(true);
    const [cardList, setCardList] = useState([]);

    function parseCards() {
        let tempCardList = [];
        for(let [index, example] of filteredExamples.entries()) {
          if (moduleDict.hasOwnProperty(example.info.moduleId)) {
            tempCardList.push(<Card exampleData={example} moduleData= {moduleDict[example.info.moduleId]} key = {index}/>)
          }
        }
        setCardList(tempCardList);
        setLoading(false);
    }

    useEffect(()=>{
        if(!isNil(filteredExamples) && filteredExamples.length) {
            parseCards();
        }
    }, [filteredExamples]);

    const {spacing} = getTheme();

    if ((!isNil(filteredExamples) && filteredExamples.length === 0)) {
        return (
          <div className={c(t.h100, t.flex, t.itemsCenter, t.justifyCenter)}>
            <div className={c(t.tc)}>
              <div>
                <Icon className={c(ColorClassNames.themePrimary)} style={{fontSize: FontSizes.xxLarge}} iconName='Error' />
              </div>
              <div className={c(t.mt5, FontClassNames.xLarge)} style={{fontWeight: FontWeights.semibold}}>
                No results matched your search.
              </div>
            </div>
          </div>
        );
      } else {
          return (
            <Stack wrap horizontal styles={{maxHeight: 800}}>
            { loading? 
              <Stack styles={{root:[ColorClassNames.whiteBackground,{width: 1600, maxHeight: 800}]}} verticalFill tokens={{childrenGap: spacing.l2}}>
                <Shimmer shimmerElements={[{ type: ElemType.line, width: '70%' }, { type: ElemType.gap, width: '30%' },{ type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.circle }, { type: ElemType.gap, width: '20%' }, { type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.line }, { type: ElemType.gap, width: '10%' }, { type: ElemType.circle }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.circle }, { type: ElemType.gap, width: '20%' }, { type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.circle }, { type: ElemType.gap, width: '30%' }, { type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.line }, { type: ElemType.gap, width: '15%' }, { type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.circle }, { type: ElemType.gap, width: '20%' }, { type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.circle }, { type: ElemType.gap, width: '30%' }, { type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.line }, { type: ElemType.gap, width: '15%' }, { type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.circle }, { type: ElemType.gap, width: '20%' }, { type: ElemType.line }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.line }, { type: ElemType.gap, width: '10%' }, { type: ElemType.circle }]}/>
                <Shimmer shimmerElements={[{ type: ElemType.circle }, { type: ElemType.gap, width: '20%' }, { type: ElemType.line }]}/>
              </Stack>
            :
              cardList
            }
            </Stack>
        );
    }
}
