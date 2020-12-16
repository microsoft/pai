import * as React from 'react';
import {useEffect, useState} from 'react';
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
import { DetailsList, DetailsListLayoutMode, SelectionMode, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ColumnActionsMode, DefaultButton, FontClassNames, Link, mergeStyles, Selection, ShimmeredDetailsList, Icon, ColorClassNames, FontSizes, FontWeights, BasePicker } from 'office-ui-fabric-react';
import {getTheme} from '@uifabric/styling';

import Convert from '../../../models/utils/convert-utils';
import CommonDebugTable from '../../../components/common/table/CommonDebugTable';
import TableProperty from '../../../components/common/table/TableProperty';
import Toggle from '../../../components/common/toggle/Toggle';
import ToggleProperty from '../../../components/common/toggle/ToggleProperty';

function SummaryTable(props) {
    const {summaryData} = props;
    const [summaryTableProperty, setSummaryTableProperty] = useState([]);
    const [isShowSummaryTable, setIsShowSummaryTable] = useState(false);

    useEffect(()=> {
      let columnDataItemArray;
      if (Convert.isNotEmptyArray(summaryData)) {
        const duration =  Object.keys(summaryData[0])
        for (let index = 0; index < summaryData.length; index++)
        {
            columnDataItemArray = duration.map((e) => {
              var formatter = getUnitConverter(e);
              return {
                  Metric: e,
                  Min: formatter.call(this, summaryData[0][e]),
                  P25: formatter.call(this, summaryData[1][e]),
                  Median: formatter.call(this, summaryData[2][e]),
                  P75: formatter.call(this, summaryData[3][e]),
                  Max: formatter.call(this, summaryData[4][e]),
                }
            })
        }
      };
      function getUnitConverter(column) {
          var bytesFormatterWrapper = function (data) {
              return Convert.formatBytes(data, 'display');
          };
          switch (column) {
              case 'duration':
                  return Convert.formatDuration;
              case 'schedulerDelay':
                  return Convert.formatDuration;
              case 'taskDesTime':
                  return Convert.formatDuration;
              case 'jvmGcTime':
                  return Convert.formatDuration;
              case 'resultSeriTime':
                  return Convert.formatDuration;
              case 'getResultTime':
                  return Convert.formatDuration;
              case 'peakExecutionMemory':
                  return bytesFormatterWrapper;
              case 'inputSize':
                  return bytesFormatterWrapper;
              case 'records':
                  return bytesFormatterWrapper;
          }
      };
      function applySortProps(column) {
            column.className =  FontClassNames.tiny;
            column.headerClassName = [FontClassNames.small, t.bgLightGray];
            column.isResizable = true;
            column.name = column.fieldName;
            column.key = column.fieldName;
            column.minWidth = 150;
            column.maxWidth = 180;
            return column;
        };
      const columnHeaderArray = [
        applySortProps({fieldName: 'Metric'}),
        applySortProps({fieldName: 'Min'}),
        applySortProps({fieldName: 'P25'}),
        applySortProps({fieldName: 'Median'}),
        applySortProps({fieldName: 'P75'}),
        applySortProps({fieldName: 'Max'}),
      ];
      // if(columnDataItemArray){
        setSummaryTableProperty(new TableProperty(columnHeaderArray, columnDataItemArray, 'TaskID', 'TaskID'));
      // }     
    }, [summaryData]);

    function handleClickisShowTable(isShow) {
        setIsShowSummaryTable(isShow);
    }

    return (
        <div>
            <div className= {c(t.mb3)}>
                <Toggle
                    className={c(FontClassNames.medium)}
                    styles={{root: {fontSize: '14px'}}}
                    toggleProperty={new ToggleProperty(handleClickisShowTable, 'Click to show summary metrics for tasks on this stage', isShowSummaryTable)}
                />
            </div>
            {summaryTableProperty && isShowSummaryTable ?
                <div style= {{width: '100%'}}>
                    <CommonDebugTable
                        tableProperty={summaryTableProperty}
                    />
                </div>:
                <div></div>
            }
        </div> 
    )
} 

export default SummaryTable