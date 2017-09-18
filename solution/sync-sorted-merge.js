'use strict';

const Heap = require('heap');

module.exports = (logSources, printer) => {

    // initialize heap with date comparator
    const heap = new Heap((a, b) => a.log.date - b.log.date);

    // load heap with initial log from each source and reference to source
    logSources.forEach((source) => {
        heap.push({
            log: source.pop(),
            source
        })
    });

    processLogs(heap, printer);
};

function processLogs(heap, printer, batchSize = 10000) {

    // loop through a batch and pop earliest log off and print
    for (let i = 0; i < batchSize && !heap.empty(); i++) {
        const logWithSource = heap.pop();
        printer.print(logWithSource.log);

        // check next log on source and push to heap if not drained
        logWithSource.log = logWithSource.source.pop();
        if (logWithSource.log) {
            heap.push(logWithSource);
        }
    }

    // kick off new batch if needed
    // this also clears up the event queue so a memory leak does not form from long running synchronous code
    if (!heap.empty()) {
        process.nextTick(() => {
            processLogs(heap, printer);
        });
    } else {
        printer.done();
    }

}