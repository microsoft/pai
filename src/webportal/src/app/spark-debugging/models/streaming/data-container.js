import { StreamingApplication } from '../schema/application'

export default class DataContainer {
    constructor(application) {
        if (!(application instanceof StreamingApplication)) {
            throw new Error('Input rate data is only available for streaming applications.');
        }
        this.application = application;
        this._data = null;
    }

    generateData() {
        throw new Error('Not Implemented');
    }

    get data() {
        if (this._data === null) {
            this._data = this.generateData();
        }
        return this._data;
    }
}