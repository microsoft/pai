import Convert from '../../utils/convert-utils';

/*
Batch schema:
{
  batchId: 1583996532000,
  batchTime: 1583996532000, // convert to UTC timestamp. Coincidentally batchId is named by timestamp too!
  status: "COMPLETED",
  batchDuration: 1000,
  inputSize: 0,
  schedulingDelay: 1,
  processingTime: 63,
  totalDelay: 64,
  numActiveOutputOps: 0,
  numCompletedOutputOps: 1,
  numFailedOutputOps: 0,
  numTotalOutputOps: 1,
}
All properties are needed
*/
export class Batch {
    constructor ({
        batchId,
        batchTime,
        status,
        batchDuration,
        inputSize,
        schedulingDelay,
        processingTime,
        totalDelay,
        numActiveOutputOps,
        numCompletedOutputOps,
        numFailedOutputOps,
        numTotalOutputOps,
        firstFailureReason,
    }) {
        // check and convert props here
        batchTime = Convert.timeString2MillSec(batchTime);
        firstFailureReason = firstFailureReason || null;

        Object.assign(this, {
            batchId,
            batchTime,
            status,
            batchDuration,
            inputSize,
            schedulingDelay,
            processingTime,
            totalDelay,
            numActiveOutputOps,
            numCompletedOutputOps,
            numFailedOutputOps,
            numTotalOutputOps,
            firstFailureReason,
        });
    }
}

