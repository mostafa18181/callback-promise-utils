class CancellationToken {
    constructor() {
        this.isCancelled = false;
    }

    cancel() {
        this.isCancelled = true;
    }
}

/**
 * Convert a callback-based function to a promise-based function
 * @param {Function} func - The callback-based function
 * @returns {Function} - The promise-based function
 */
function callbackToPromise(func) {
    const cache = new WeakMap();

    return function (...args) {
        if (cache.has(func)) {
            return cache.get(func);
        }

        const promise = new Promise((resolve, reject) => {
            func(...args, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });

        cache.set(func, promise);
        return promise;
    };
}

/**
 * Convert a promise-based function to a callback-based function
 * @param {Function} promiseFunc - The promise-based function
 * @returns {Function} - The callback-based function
 */
function promiseToCallback(promiseFunc) {
    return function (...args) {
        const callback = args.pop();
        promiseFunc(...args)
            .then(result => callback(null, result))
            .catch(err => callback(err));
    };
}

/**
 * Run tasks in series
 * @param {Array<Function>} tasks - Array of functions returning promises
 * @returns {Promise} - Promise resolving when all tasks are done
 */
function series(tasks) {
    const results = [];
    return tasks.reduce((promise, task) => {
        return promise.then(() => task().then(result => results.push(result)));
    }, Promise.resolve()).then(() => results);
}

/**
 * Run tasks in parallel
 * @param {Array<Function>} tasks - Array of functions returning promises
 * @returns {Promise} - Promise resolving when all tasks are done
 */
function parallel(tasks) {
    return Promise.all(tasks.map(task => task()));
}

/**
 * Run tasks in waterfall
 * @param {Array<Function>} tasks - Array of functions accepting a callback
 * @returns {Promise} - Promise resolving when all tasks are done
 */
function waterfall(tasks) {
    return tasks.reduce((promise, task) => {
        return promise.then(result =>
            new Promise((resolve, reject) => {
                task((err, res) => {

                    if (err) {
                        return reject(err);
                    }
                    resolve([...result, res]);
                });
            })
        );
    }, Promise.resolve([]));
}

/**
 * A priority queue for managing tasks efficiently
 */
class PriorityQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(task, priority = 0) {
        this.queue.push({task, priority});
        this.queue.sort((a, b) => b.priority - a.priority); // Higher priority tasks first
    }

    dequeue() {
        return this.queue.shift().task;
    }

    isEmpty() {
        return this.queue.length === 0;
    }
}

/**
 * Run tasks in a queue with concurrency control
 * @param {Array<Function>} tasks - Array of functions returning promises
 * @param {number} concurrency - Number of tasks to run in parallel
 * @returns {Promise} - Promise resolving when all tasks are done
 */
function queue(tasks, concurrency) {
    const taskQueue = new PriorityQueue();
    let activeCount = 0;
    const results = [];
    let resolveFinal;
    let rejectFinal;

    tasks.forEach(task => taskQueue.enqueue(task));

    const next = () => {
        if (taskQueue.isEmpty() && activeCount === 0) {
            return resolveFinal(results);
        }

        while (activeCount < concurrency && !taskQueue.isEmpty()) {
            activeCount++;
            const task = taskQueue.dequeue();
            task().then(result => {
                results.push(result);
                activeCount--;
                next();
            }).catch(err => {
                rejectFinal(err);
            });
        }
    };

    return new Promise((resolve, reject) => {
        resolveFinal = resolve;
        rejectFinal = reject;
        next();
    });
}

/**
 * Convert a callback-based function to a promise-based function with cancellation support
 * @param {Function} func - The callback-based function
 * @returns {Function} - The promise-based function with cancellation support
 */
function callbackToPromiseWithCancellation(func) {
    return function (...args) {
        const cancellationToken = new CancellationToken();
        const promise = new Promise((resolve, reject) => {
            func(...args, (err, result) => {
                if (cancellationToken.isCancelled) {
                    return reject(new Error('Operation cancelled'));
                }
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });

        promise.cancel = () => cancellationToken.cancel();
        return promise;
    };
}

/**
 * Reflect a promise to always resolve with an object describing its state
 * @param {Function} promiseFunc - The promise-based function
 * @returns {Function} - The reflected function
 */
function reflect(promiseFunc) {
    return function (...args) {
        return promiseFunc(...args)
            .then(result => ({isFulfilled: true, isRejected: false, value: result}))
            .catch(error => ({isFulfilled: false, isRejected: true, reason: error}));
    };
}

////////////////////
function map(items, mapper, concurrency) {
    const tasks = items.map(item => () => mapper(item));
    return queue(tasks, concurrency);
}

/**
 * Reduce tasks sequentially
 * @param {Array} items - Array of items
 * @param {Function} reducer - Function to reduce items to a single value
 * @param {*} initialValue - Initial value for the reduction
 * @returns {Promise} - Promise resolving when all tasks are done
 */
function reduce(items, reducer, initialValue) {
    return items.reduce((promise, item) => {
        return promise.then(accumulator => reducer(accumulator, item));
    }, Promise.resolve(initialValue));
}

/**
 * Returns a promise that resolves with the value of the first resolved promise
 * @param {Array<Promise>} promises - Array of promises
 * @returns {Promise} - Promise resolving with the value of the first resolved promise
 */
function any(promises) {
    return new Promise((resolve, reject) => {
        const errors = [];
        promises.forEach(promise => {
            promise.then(resolve).catch(err => {
                errors.push(err);
                if (errors.length === promises.length) {
                    reject(new AggregateError(errors, 'All promises were rejected'));
                }
            });
        });
    });
}


/**
 * Returns a promise that resolves with an array of the results of all promises
 * @param {Array<Promise>} promises - Array of promises
 * @returns {Promise} - Promise resolving with an array of the results of all promises
 */
function allSettled(promises) {
    return Promise.all(promises.map(promise => {
        return promise.then(value => ({
            status: 'fulfilled',
            value
        })).catch(reason => ({
            status: 'rejected',
            reason
        }));
    }));
}

/**
 * Resolves a map of promises to a map of resolved values
 * @param {Object} obj - Object containing promises
 * @returns {Promise} - Promise resolving to an object with resolved values
 */
function props(obj) {
    const keys = Object.keys(obj);
    const promises = keys.map(key => obj[key]);
    return Promise.all(promises).then(results => {
        const resolvedObj = {};
        results.forEach((result, index) => {
            resolvedObj[keys[index]] = result;
        });
        return resolvedObj;
    });
}

/**
 * Execute tasks sequentially
 * @param {Array} items - Array of items
 * @param {Function} iterator - Function to execute on each item
 * @returns {Promise} - Promise resolving when all tasks are done
 */
function each(items, iterator) {
    return items.reduce((promise, item) => {
        return promise.then(() => iterator(item));
    }, Promise.resolve());
}

module.exports = {
    callbackToPromise,
    promiseToCallback,
    series,
    parallel,
    waterfall,
    queue,
    map,
    reduce,
    any,

    allSettled,
    props,
    each
};
