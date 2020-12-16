/*
Receiver schema:
{
    streamId": 0,
    streamName: "SocketReceiver-0",
    isActive: true,
    executorId: "driver", // optional
    executorHost: "MININT-HNJRDB3.fareast.corp.microsoft.com", // optional
    lastErrorTime: 1584000191000, // optional
    lastErrorMessage: "", //optional
    avgEventRate: 0.0,
    eventRates: [
        [ 1584000191000, 0.0 ],
        [ 1584000192000, 0.0 ],
        [ 1584000193000, 0.0 ],
        ...
    ],
}
*/
export class Receiver {
    constructor({
        streamId,
        streamName,
        isActive,
        executorId,
        executorHost,
        lastErrorTime,
        lastErrorMessage,
        avgEventRate,
        eventRates,
    }) {
        // check and convert props here
        executorId = executorId || null;
        executorHost = executorHost || null;
        lastErrorTime = lastErrorTime || null;
        lastErrorMessage = lastErrorMessage || null;

        Object.assign(this, {
            streamId,
            streamName,
            isActive,
            executorId,
            executorHost,
            lastErrorTime,
            lastErrorMessage,
            avgEventRate,
            eventRates,
        });
    }
}