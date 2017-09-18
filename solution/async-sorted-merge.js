'use strict';

const Heap = require('heap');

module.exports = (logSources, printer) => {

    // initialize heap with date comparator
    const heap = new Heap((a, b) => a.log.date - b.log.date);

    // kick off all initial promises at once
    Promise.all(logSources.map(async (source) => {
        return {
            log: await source.popAsync(),
            source
        };
    }))
    .then((initialLogs) => {
        // load heap with initial log from each source and reference to source
        initialLogs.forEach((log) => heap.push(log));
        processLogs(heap, printer);
    });
};

// pop next log asynchronously, push onto heap if exists, call self
// when all sources are drained it will print stats
function processLogs(heap, printer) {
    if (!heap.empty()) {
        const logWithSource = heap.pop();
        printer.print(logWithSource.log);
        logWithSource.source.popAsync().then((log) => {
            logWithSource.log = log;
            if (logWithSource.log) {
                heap.push(logWithSource);
            }

            // will not stack overflow because it's being kicked off by the callback in the event loop
            processLogs(heap, printer);
        });
    } else {
        printer.done();
    }
}