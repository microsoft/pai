import c from 'classnames';
import t from '../../components/tachyons.scss';
import PropTypes from 'prop-types';
import {Stack, DefaultPalette} from 'office-ui-fabric-react';
import React from 'react';
import {isEmpty} from 'lodash';
import {statusColor} from '../../components/theme';

export const TokenUsage = ({navigatedBySubCluster, ResourceInfo, isVirtualColumn, isShowCircle}) => {
  let capacityAndResourceInfoTotal = [];
  if (!ResourceInfo) {
    return null;
  }

  if (isVirtualColumn) {
    if (navigatedBySubCluster) {
      capacityAndResourceInfoTotal = ResourceInfo['scheduler']['schedulerInfo']['capacityAndResourceInfo'];
    } else {
      const subInfo = Object.keys(ResourceInfo).map((item, index) => {
        return ResourceInfo[item]['capacityAndResourceInfo'];
      });
      capacityAndResourceInfoTotal = subInfo.flat(Infinity);
    }
  } else {
    capacityAndResourceInfoTotal = ResourceInfo;
  }

  const capacityAndResourceInfoFilter = capacityAndResourceInfoTotal.filter((item, index) => {
    if (!isEmpty(item.label) && item.label != 'harvest') {
      return item;
    }
  });

  const resourcesInfo = capacityAndResourceInfoFilter.map(({resourcesAllocated, resourcesConfigured, label}) => {
    const resUser = Number(
      Math.max(
        resourcesAllocated.memory / 6 / 1024,
        resourcesAllocated.vCores / 2
      ).toFixed(0)
    );
    const resConfigured = Number(
      Math.min(
        resourcesConfigured.memory / 6 / 1024,
        resourcesConfigured.vCores / 2
      ).toFixed(0)
    );
    return {
      resourcesAllocated: resUser,
      resourcesConfigured: resConfigured,
    };
  });

  function computeTotal(infos) {
    const userTotal = infos.reduce((userMemory = 0, info) => {
      return userMemory + info.resourcesAllocated;
    }, 0);
    const configCoreTotal = infos.reduce((userCores = 0, info) => {
      return userCores + info.resourcesConfigured;
    }, 0);
    return {
      resourcesAllocated: userTotal,
      resourcesConfigured: configCoreTotal,
    };
  }
  const getResourceUtilization = (used, guaranteed) =>{
    if (Math.abs(guaranteed) < 1e-5) {
      return 0;
    }
    return used / guaranteed;
  };
  const {resourcesAllocated, resourcesConfigured} = computeTotal(resourcesInfo);
  const proportionInfo = `${resourcesAllocated} / ${resourcesConfigured}`;

  const possession = getResourceUtilization(resourcesAllocated, resourcesConfigured);

  let barColor = statusColor.succeeded;
  if (possession >= 0.8) {
    barColor = statusColor.waiting;
  }
  if (possession >= 1) {
    barColor = statusColor.failed;
  }

  return (
    <Stack horizontal gap='s1'>
      {
        isShowCircle &&
        <div style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: barColor, margin: 'auto 0'}}></div>
      }
      <div
        className={c(t.darkGray)}
        style={{textAlign: 'center'}}
      >
        {proportionInfo}
      </div>
    </Stack>
  );
};

TokenUsage.propTypes = {
  ResourceInfo: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  isVirtualColumn: PropTypes.bool,
  navigatedBySubCluster: PropTypes.bool,
};
