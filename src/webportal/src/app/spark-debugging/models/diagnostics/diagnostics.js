//import SkewThreadhold from '../diagnostics/skew-threshold';
import Convert from '../utils/convert-utils';

export class ThresholdItem {
    constructor(fullAppId, type, name, defaultValue, list, unit) {
        this.localStorageKey = fullAppId + "_" + type + '_' + name;
        this.name = name;
        this.value = window.localStorage.getItem(this.localStorageKey) || name + '_' + defaultValue;
        this.selectedList = list.map((number) => ({
            key: name + '_' + number,
            text: String(number) + ' ' + unit
        }));
        this.unit = unit;
    }

    getValue() {
        return this.value.replace(this.name + '_', '');
    }

    setValue(value) {
        if (this.value != value) {
            window.localStorage.setItem(this.localStorageKey, value);
            this.value = window.localStorage.getItem(this.localStorageKey);
            return true;
        }
        return false;
    }
}


class DiagItem {
    constructor(task, value, details) {
        this.task = task;
        this.value = value;
        this.details = details;
    }

}


export class DiagnoseResult {
    constructor(name, desc, funcName, thresholdItemList, enabled = true) {
        this.name = name;
        this.desc = desc;
        this.funcName = funcName;
        this.thresholdItemList = thresholdItemList;
        this.diagItemList = new Array();
        this.enabled = enabled;
    }

    //thresholdItemList, diagItemList, 
    updateThreshold(value) {
        let name = value.key.substring(0, value.key.indexOf('_'));
        let item = this.thresholdItemList.find(d => d.name === name);
        if (item) {
            return item.setValue(value.key);
        }
        return false;
    }
}

export default class Diagnotor {
    constructor(fullAppId) {
        this.diagnoseResults = [

            new DiagnoseResult('Data Skew', 'Task with data operation size more than N times of average', this.diagDataSkew,
                [new ThresholdItem(fullAppId, 'DataSkew', 'dataSizeInM', 512, [0, 128, 256, 512, 1024, 2048], 'M'),
                new ThresholdItem(fullAppId, 'DataSkew', 'times', 2, [1, 2, 3, 5, 10], 'times')])

            ,

            new DiagnoseResult('Time Skew', 'The task running time is slower than N times of average', this.diagTimeSkewByRatio,
                [new ThresholdItem(fullAppId, 'TimeSkew', 'timeInM', 10, [0, 1, 5, 10, 20, 60, 120], 'minutes'),
                new ThresholdItem(fullAppId, 'TimeSkew', 'times', 2, [1, 2, 3, 5, 10], 'times')])
            ,

            new DiagnoseResult('Delay Skew', 'Scheduler Delay of a task is more than', this.diagSchedulerDelaySkew,
                [new ThresholdItem(fullAppId, 'DelaySkew', 'delayInM', 10, [0, 1, 5, 10, 20, 60, 120], 'minutes')])

        ];
    }

    updateDiagResults(stageAttempt, diagKey) {
        let ret = false;
        let succTasks = stageAttempt.tasks.filter(task => task.status === 'SUCCESS');
        if (succTasks.length <= 1) {
            return ret;
        }

        if (diagKey === null) {
            for (let diag of this.diagnoseResults) {
                diag.diagItemList = diag.diagItemList.concat(diag.funcName(succTasks, diag.thresholdItemList));
                if (diag.diagItemList.length > 0) {
                    ret = true;
                }
            }
        }
        else {
            let diag = this.diagnoseResults.find(d => d.name === diagKey);
            diag.diagItemList = diag.diagItemList.concat(diag.funcName(succTasks, diag.thresholdItemList));
            if (diag.diagItemList.length > 0) {
                ret = true;
            }
        }

        return ret;
    }

    hasSkew() {
        for (let diag of this.diagnoseResults) {
            if (diag.diagItemList.length > 0)
                return true;
        }
        return false;
    }

    clear(diagKey) {
        if (diagKey === null) {
            for (let diag of this.diagnoseResults) {
                diag.diagItemList = [];
            }
        }
        else {
            let diag = this.diagnoseResults.find(d => d.name === diagKey);
            diag.diagItemList = [];
        }
    }


    // Diagnose
    diagDataSkew(tasks, thresholdItemList) {
        let diagItems = new Array();
        let dataSizeInM = thresholdItemList.find(d => d.name === 'dataSizeInM').getValue();
        let times = thresholdItemList.find(d => d.name === 'times').getValue();

        let candidateTasks = tasks.filter(task => (task.readBytes + task.bytesWritten + task.shuffleLocalBytesRead + task.shuffleBytesWritten) > dataSizeInM * 1024 * 1024);
        if (candidateTasks.length > 0) {
            let totalSize = _.sum(tasks.map(task => (task.readBytes + task.bytesWritten + task.shuffleLocalBytesRead + task.shuffleBytesWritten) / 1024 / 1024));
            for (let task of candidateTasks) {
                let dataSize = (task.readBytes + task.bytesWritten + task.shuffleLocalBytesRead + task.shuffleBytesWritten) / 1024 / 1024;
                let avgSize = (totalSize - dataSize) / (tasks.length - 1);
                if (dataSize > avgSize * times) {
                    diagItems.push(new DiagItem(task, dataSize + ' MB',
                        (dataSize / (avgSize === 0.0 ? 1 : avgSize)).toFixed(2) + " times of average data operation size (" + dataSize.toFixed(2) + "(MB)\\" + avgSize.toFixed(2) + "(MB)"));
                }
            }
        }
        return diagItems;
    }

    diagTimeSkewByRatio(tasks, thresholdItemList) {
        let diagItems = new Array();
        let timeInM = thresholdItemList.find(d => d.name === 'timeInM').getValue();
        let times = thresholdItemList.find(d => d.name === 'times').getValue();
        let taskWithData = tasks.filter(task => ((task.readBytes + task.bytesWritten + task.shuffleLocalBytesRead + task.shuffleBytesWritten) > 0) && (task.executorRunTime > timeInM * 1000 * 60));

        if (taskWithData && taskWithData.length > 0) {
            let medianRate = Convert.median(tasks.map(task => task.executorRunTime / (task.readBytes + task.bytesWritten + task.shuffleLocalBytesRead + task.shuffleBytesWritten))).toFixed(5);
            for (let task of taskWithData) {
                let exeRatio = (task.executorRunTime / (task.readBytes + task.bytesWritten + task.shuffleLocalBytesRead + task.shuffleBytesWritten)).toFixed(5);
                if ((exeRatio - medianRate * times) > 0.00001) {
                    diagItems.push(new DiagItem(task, exeRatio,
                        (exeRatio / medianRate).toFixed(2) + " times of median execution time under simliar data size (" + exeRatio
                        + "\\(median)" + medianRate + ")"));
                }
            }
        }
        let taskLessData = tasks.filter(task => ((task.readBytes + task.bytesWritten + task.shuffleLocalBytesRead + task.shuffleBytesWritten) === 0)
            && (task.executorRunTime > timeInM * 1000 * 60));
        if (taskLessData && taskLessData.length > 0) {
            let median = Convert.median(taskLessData.map(task => task.executorRunTime));
            for (let task of taskLessData) {
                if ((median > 0) && (task.executorRunTime - median * times > 0)) {
                    diagItems.push(new DiagItem(task, Convert.formatDuration(task.executorRunTime),
                        (task.executorRunTime / median).toFixed(4) + " times of median execution time under simliar data size (" + (task.executorRunTime).toFixed(4)
                        + "\\(median)" + (median / 1000 / 60).toFixed(4) + ")"));
                }
            }
        }
        return diagItems;
    }

    diagSchedulerDelaySkew(tasks, thresholdItemList) {
        let diagItems = new Array();
        let delayInM = thresholdItemList.find(d => d.name === 'delayInM').getValue();

        let candidateTasks = tasks.filter(task => (task.schedulerDelay > delayInM * 1000 * 60));
        for (let task of candidateTasks) {
            diagItems.push(new DiagItem(task, Convert.formatDuration(task.schedulerDelay),
                "Scheduler Delay is " + Convert.formatDuration(task.schedulerDelay) + ", more than " + delayInM + " minutes"));

        }
        return diagItems;
    }

}