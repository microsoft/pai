class GraphDataDeal {
    static getDataSkewGraphData(executorInfo) {
        let dataSkewData = new Array();
        let taskList = executorInfo.taskList;
        if (taskList == null || taskList.length === 0) {
            return [];// to-do deal task is empty
        }
        for (let task of taskList) {
            let drawData = new DrawData();
            drawData.y = task.duration;//ms
            drawData.text = task.taskId; 
            drawData.x = task.readBytes + task.readBytes 
            + task.shuffleLocalBytesRead + task.shuffleBytesWritten + task.shuffleRemoteBytesRead;
            dataSkewData.push(drawData);
            drawData.stageId = task.stageId;
        }
        return dataSkewData;
    }

    static getExecutorVcoreData(executorInfo, arraySize, singleCore) {
        let tasks = executorInfo.taskList;
        if (tasks == null || tasks.length === 0) {
            return [];// to-do deal taask is empty
        }
        tasks.sort((a, b) => a.launchTime - b.launchTime);
        let arr = new Array();
        let mi = tasks.map(x => x.launchTime).reduce((a, b) => Math.min(a, b));
        let ma = tasks.map(x => x.finishTime).reduce((a, b) => Math.max(a, b));
        let gap = (ma - mi) / arraySize;
        for (let i = -1; i <= arraySize + 1; i++) {
            let t = gap * i + mi;
            let taskNum = this.getTaskNumber(tasks, t);
            arr.push(new DrawData(t, taskNum * singleCore));
        }
        return arr;
    }

    static getTaskNumber(tasks, time) {
        let count = 0;
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].launchTime <= time && tasks[i].finishTime >= time) {
                count++;
            }
            if (tasks[i].launchTime > time) {
                return count;
            }
        }
        return count;
    }

    static getTaskRunData(executorInfo) {
        if (executorInfo.taskList == null || executorInfo.taskList.length == 0) {
            return [];
        }
        let tasks = executorInfo.taskList.sort((a, b) => a.launchTime - b.launchTime);

        let drawDataArr = new Array();
        let drawNum = 1;
        for (let index = 0; index < tasks.length; index++) {
            
            let task = tasks[index];
            let dataSet = [task.launchTime,task.finishTime];
            let res = new DrawData(dataSet,drawNum,task.taskId,this.setColor(task), task.stageId);
            drawNum++;
            drawDataArr.push(res);
        }
        return drawDataArr;
    }

    static setColor(task) {
        if (task.status === "SUCCESS") {
            return "green";
        } else if (task.status === "FAILED") {
            return "red"
        } else if (task.status === "KILLED") {
            return "blue"
        } else if (task.status === "RUNNING") {
            return "orange"
        }
        return "yellow";
    }
}

class DrawData {
    constructor(x, y, text, extend, stageId) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.extend = extend;
        this.stageId = stageId;
    }
}

export {
    GraphDataDeal
}
