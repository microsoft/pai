import Convert from '../utils/convert-utils'

class ExecutorInfo {
    constructor(response) {
        this._id = response["id"];

        if (response.hasOwnProperty('host')) {
            this._hostPort = response["host"];
        } else if (response.hasOwnProperty('hostPort')) {
            this._hostPort = response["hostPort"];
        } else {
            this._hostPort = "";
            console.log("ERROR: lack hostPort property!");
        }
        
        this._isActive = response["isActive"];
        this._rddBlocks = response["rddBlocks"];
        this._memoryUsed = response["memoryUsed"];
        this._diskUsed = response["diskUsed"];
        this._totalCores = response["totalCores"];
        this._activeTasks = response["activeTasks"];
        this._failedTasks = response["failedTasks"];
        this._completedTasks = response["completedTasks"]; 
        this._totalTasks = response["totalTasks"];
        this._totalDuration = response["totalDuration"];
        this._totalGCTime = response["totalGCTime"];
        this._totalInputBytes = response["totalInputBytes"];
        this._totalShuffleRead = response["totalShuffleRead"];
        this._totalShuffleWrite = response["totalShuffleWrite"];
        this._maxMemory = response["maxMemory"];
        this._removeReason = response["removeReason"];
        
        if (response.hasOwnProperty('executorLogs')) {
            this.stderr = response["executorLogs"]["stderr"];
            this.stdout = response["executorLogs"]["stdout"];
        } else if (response.hasOwnProperty('stdout') && response.hasOwnProperty('stderr')) {
            this.stderr = response["stderr"];
            this.stdout = response["stdout"];
        } else {
            this.stderr = "";
            this.stdout = "";
            console.log("ERROR: lack stdout and stderr property!");
        }
    }
    get executorDataSize() {
        return Number(this._totalInputBytes) + Number(this._totalShuffleRead) + Number(this._totalShuffleWrite);
    }
    get executionTime() {
        return Number(this._totalDuration);
    }
    get id() {
        return this._id;
    }
    get address() {
        return this._hostPort;
    }
    get status() {
        return this._isActive? 'Active': 'Dead';
    }
    get rddBlocks() {
        return this._rddBlocks;
    }
    get storageMemory() {
        return Convert.formatBytes(Number(this._memoryUsed), 'display') + ' / ' + Convert.formatBytes(Number(this._maxMemory), 'display');
    }
    get diskUsed() {
        return this._diskUsed;
    }
    get cores() {
        return this._totalCores;
    }
    get activeTasks() {
        return this._activeTasks;
    }
    get failedTasks() {
        return this._failedTasks;
    }
    get completedTasks() {
        return this._completedTasks;
    }
    get totalTasks() {
        return this._totalTasks;
    }
    get taskTimeAndGCTime() {
        return this._totalGCTime;
    }
    get input() {
        return this._totalInputBytes;
    }
    get shuffleRead() {
        return this._totalShuffleRead;
    }
    get shuffleWrite() {
        return this._totalShuffleWrite;
    }
    get removeReason() {
        return this._removeReason;
    }
    toString() {
        return 'id: ' + this.id +
            ' address: ' + this.address +
            ' status: ' + this.status +
            ' rdd blocks: ' + this.rddBlocks +
            ' storage memory: ' + this.storageMemory +
            ' disk used: ' + this.diskUsed +
            ' cores: ' + this.cores +
            ' active tasks: ' + this.activeTasks +
            ' failed tasks: ' + this.failedTasks +
            ' complete task: ' + this.completedTasks +
            ' total tasks:' + this.totalTasks +
            ' task time(GC Time):' + this.taskTimeAndGCTime +
            ' Input:' + this.input +
            ' Shuffle Read: ' + this.shuffleRead +
            ' Shuffle Write: ' + this.shuffleWrite +
            ' logs: stderr: ' + this.stderr +
            ' logs: stdout: ' + this.stdout;
    }

}

class ExecutorList {
    /**
     * construction function, if application is not empty, the executor property will use application data instead of downloading again
     * @param {Application} application the application data
     * @param {number[]} jobIds 
     */
    constructor(application, jobIds = []) {
        if (jobIds.length === 0){
            this.executors = ExecutorList.getExecutorsFromApplicationData(application).sort(ExecutorList.cmp);
        } else {
            this.executors = ExecutorList.getExecutorsByJobIds(application, jobIds);
        }
        this.maxExecutorDataSize = 50;
        this.maxExecutionTime = 50;
        if (this.executors.length == 0) {
            this.executorDataSizeUnitName = "B";
            this.executionTimeUnitName = "ms";
            return;
        }
        for (var i = 0; i < this.executors.length; i++) {
            if (this.executors[i].executorDataSize > this.maxExecutorDataSize)
                this.maxExecutorDataSize = this.executors[i].executorDataSize;
            
            if (this.executors[i].executionTime > this.maxExecutionTime)
                this.maxExecutionTime = this.executors[i].executionTime;
            
        }
        this.executorDataSizeUnitName = Convert.getBytesUnitName(this.maxExecutorDataSize);
        this.executionTimeUnitName = Convert.getTimeUnitName(this.maxExecutionTime);
    }

    static getExecutorsFromApplicationData(application) {
        let resArray = [];
        application.executorList.forEach(element => {
            resArray.push(new ExecutorInfo(element));
        });
        return resArray;
    }
    
    static getExecutorsByJobIds(app, jobIds) {
        let stages = [];
        for (let id of jobIds) {
            stages = stages.concat(app.getSpecifyJobStages(id))
        }
        let exeIds = [];
        for (let stage of stages) {
            let attempts = stage.attempts;
            for (let attempt of attempts) {
                exeIds = exeIds.concat(attempt.tasks.map(t => t.executorId));
            }
        }
        return this.filterExecutorByTaskIds(app, exeIds);
    }

    static filterExecutorByTaskIds(app, exeIds) {
        let allexecutors = app.executorList;
        let filterExecutors = allexecutors.filter(e => exeIds.includes(e.id));

        let resArray = [];
        filterExecutors.forEach(element => {
            resArray.push(new ExecutorInfo(element));
        });
        return resArray;
    }

    static cmp(executorA, executorB) {
        if (executorA.id == 'driver')
            return -1;
        else if (executorB.id == 'driver')
            return 1;
        else
            return Number(executorA.id) - Number(executorB.id);
    }
}

export {
    ExecutorList
}