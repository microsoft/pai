import {isNil} from 'lodash';
import {getErrorGroupsByFuzzySet} from '../../../../components/util/errors';

export default class FrameworkContainerErrors {
  static getErrorGroups(taskRoles) {
    const maxErrorMsgCount = 2000;

    let allErrorInfos = [];
    let tasks = taskRoles.taskStatuses;
    for (let task of tasks) {
      if (task.taskState === 'FAILED' && task.containerExitDiagnostics !== '') {
        allErrorInfos.push(task);
      }
      if (allErrorInfos.length >= maxErrorMsgCount) {
        break;
      }
    }

    return getErrorGroupsByFuzzySet(allErrorInfos, (task) => {
      if (isNil(task.containerExitDiagnostics)) return 'N/A';
      let containerExceptionMsg = task.containerExitDiagnostics;
      const regex = /Last \d* bytes of exit_diagnostics_file.*?:/;
      const found = containerExceptionMsg.match(regex);
      if (isNil(found)) return containerExceptionMsg;
      return containerExceptionMsg.substring(found.index + found[0].length);
    });
  }
}