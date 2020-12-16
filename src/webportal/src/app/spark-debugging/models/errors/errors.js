import _ from 'lodash';
import {getErrorGroupsByFuzzySet} from '../../../components/util/errors';


export default class SparkErrors {
    static getErrorGroups(attempts) {
        const maxErrorMsgCount = 2000;

        let allErrorInfos = new Array();
        let tasks = attempts.flatMap((a) => a.tasks);
        for (let task of tasks) {
            if (task.status === 'FAILED' && task.errorMessage !== '') {
                allErrorInfos.push(task);
            }
            if (allErrorInfos.length >= maxErrorMsgCount) {
                break;
            }
        }

        return getErrorGroupsByFuzzySet(allErrorInfos, (task) => task.errorMessage);
    }

    static getAllErrorGroups(application) {
        let allAttempts = application.getAllStages().flatMap(s => s.attempts);
        return this.getErrorGroups(allAttempts);
    }

    static getLatestAttemptErrorGroups(application) {
        let latestAttempts = application.getAllStages().map(s => s.getLastAttempt());
        return this.getErrorGroups(latestAttempts);
    }
}