import DataContainer from './data-container'
import * as stat from '../utils/statistic'

/* Data format:
{
    inputRate: {
        batchCount: number,
        activeCount: number,
        completedCount: number,
        data: [
            {
                batchId: number,
                batchTime: number, // unix timestamp in milliseconds
                recordsPerSecond: number,
            },
            ...
        ],
        avgInputRate,
        inputRateP75,
        inputRateP95,
    },
    receivers: [
        {
            streamId: number,
            streamName: string,
            data: [
                {
                    eventTime: number, // unix timestamp in milliseconds
                    eventRate: number, // records/s
                },
                ...
            ],
            avgEventRate: number,
            eventRate75: number,
            eventRate95: number,
        },
        ...
    ]
}
*/
export default class InputRateDataContainer extends DataContainer {
    get convertBatchData() {
        const batchLimit = 1000; // reserve latest 1000 batches
        let latestBatches = this.application.batches.slice(0, batchLimit).reverse(); // Copy and reverse so the order is time-increasing

        let batchCount = latestBatches.length;
        let activeCount = latestBatches.filter(batch => batch.status === 'PROCESSING').length;
        let completedCount = latestBatches.filter(batch => batch.status === 'COMPLETED').length;

        let data = latestBatches.map(
            ({batchId, batchTime, batchDuration, inputSize}) => ({
                batchId: batchId,
                batchTime: batchTime, // TODO: Clarify time format
                recordsPerSecond: inputSize*1000/batchDuration, // The original unit is ms.
            })
        );
        let sortedInputRates = data.map(item => item.recordsPerSecond).sort((a, b) => a - b); // sort in increasing order
        let avgInputRate = stat.avg(sortedInputRates);
        let inputRateP75 = stat.p75(sortedInputRates);
        let inputRateP95 = stat.p95(sortedInputRates);

        return {
            batchCount,
            activeCount,
            completedCount,
            data,
            avgInputRate,
            inputRateP75,
            inputRateP95,
        }
    }

    convertReceiverData({streamId, streamName, eventRates}) {
        const eventRateLimit = 1000; // Should be same as batchLimit above.
        let latestEventRates = eventRates.slice(-eventRateLimit);

        let data = latestEventRates.map(
            ([eventTime, eventRate]) => ({
                eventTime,
                eventRate,
            })
        )
        let sortedEventRates = data.map(item => item.eventRate).sort((a, b) => a - b);
        let avgEventRate = stat.avg(sortedEventRates);
        let eventRateP75 = stat.p75(sortedEventRates);
        let eventRateP95 = stat.p95(sortedEventRates);
        return {
            streamId,
            streamName,
            data,
            avgEventRate,
            eventRateP75,
            eventRateP95,
        };
    }

    generateData() {
        return {
            inputRate: this.convertBatchData,
            receivers: this.application.receivers.map(this.convertReceiverData),
        }
    }
}
