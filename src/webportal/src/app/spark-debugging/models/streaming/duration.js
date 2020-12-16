import DataContainer from './data-container'
import * as stat from '../utils/statistic'

/* Data format:
{
    schedulingDelay: {
        data: [
            {
                batchId: number,
                batchTime: number,
                value: number, 
            },
            ...
        ],
        avg: number,
        p75: number,
        p95: number,
    },
    processingTime: same as above,
    totalDelay: same as above,
}
*/
export default class DurationDataContainer extends DataContainer  {
    /** Util method to extract property value and statistics from batch data. 
     */
    getBatchPropertyData(propName) {
        const batchLimit = 1000; // reserve latest 1000 batches
        let latestBatches = this.application.batches.slice(0, batchLimit).reverse(); // Copy and reverse so the order is time-increasing

        let data = latestBatches.map(
            (batch) => ({
                batchId: batch.batchId,
                batchTime: batch.batchTime,
                value: batch[propName],
            })
        );
        let sortedNums = latestBatches.map((batch) => (batch[propName])).sort((a, b) => a - b);
        let avg = stat.avg(sortedNums);
        let p75 = stat.p75(sortedNums);
        let p95 = stat.p95(sortedNums);
        return {
            data,
            avg,
            p75,
            p95,
        }
    }

    generateData() {
        let schedulingDelay = this.getBatchPropertyData('schedulingDelay');
        let processingTime = this.getBatchPropertyData('processingTime');
        let totalDelay = this.getBatchPropertyData('totalDelay');

        return {
            schedulingDelay,
            processingTime,
            totalDelay,
        }
    }
}
