

# Callback-Promise-Utils

**Callback-Promise-Utils** is a versatile utility library designed to facilitate the conversion between callback-based
and promise-based asynchronous functions in JavaScript. It also provides a suite of tools for handling asynchronous
operations, including running tasks in series, parallel, and with concurrency control.

## Features

- **Callback to Promise Conversion**: Easily convert callback-based functions to promise-based ones.
- **Promise to Callback Conversion**: Convert promise-based functions back to callback-based ones.
- **Task Execution**: Run tasks in series, parallel, or waterfall. Control task concurrency with queues.
- **Utility Functions**: Various utility functions to work with promises, including mapping, reducing, and reflecting
  promises.

## Installation

To install this package, simply use npm:

```bash
npm install callback-promise-utils
```

## Usage

### Converting Callback Functions to Promises

```javascript
const {callbackToPromise} = require('callback-promise-utils');

const asyncFunction = (param, callback) => {
    setTimeout(() => {
        callback(null, `Result: ${param}`);
    }, 1000);
};

const promiseFunction = callbackToPromise(asyncFunction);

promiseFunction('test').then(result => {
    console.log(result); // Output: "Result: test"
}).catch(err => {
    console.error(err);
});
```

### Converting Promise Functions to Callbacks

```javascript
const {promiseToCallback} = require('callback-promise-utils');

const promiseFunction = (param) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Result: ${param}`);
        }, 1000);
    });
};

const callbackFunction = promiseToCallback(promiseFunction);

callbackFunction('test', (err, result) => {
    if (err) {
        return console.error(err);
    }
    console.log(result); // Output: "Result: test"
});
```

### Running Tasks in Series

```javascript
const {series} = require('callback-promise-utils');

async function runSeries() {
    const tasks = [
        () => Promise.resolve('Task 1'),
        () => Promise.resolve('Task 2'),
        () => Promise.resolve('Task 3')
    ];

    const results = await series(tasks);
    console.log(results); // Output: ['Task 1', 'Task 2', 'Task 3']
}

runSeries();
```

### Running Tasks in Parallel

```javascript
const {parallel} = require('callback-promise-utils');

async function runParallel() {
    const tasks = [
        () => Promise.resolve('Task 1'),
        () => Promise.resolve('Task 2'),
        () => Promise.resolve('Task 3')
    ];

    const results = await parallel(tasks);
    console.log(results); // Output: ['Task 1', 'Task 2', 'Task 3']
}

runParallel();
```

### Running Tasks in a Queue with Concurrency Control

```javascript
const {queue} = require('callback-promise-utils');

async function runQueue() {
    const tasks = [
        () => Promise.resolve('Task 1'),
        () => Promise.resolve('Task 2'),
        () => Promise.resolve('Task 3')
    ];

    const results = await queue(tasks, 2); // Run 2 tasks in parallel
    console.log(results); // Output: ['Task 1', 'Task 2', 'Task 3']
}

runQueue();
```

## Benchmarking

To run performance benchmarks comparing this utility with other libraries, simply run:

```bash
npm test
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests on
the https://github.com/mostafa18181/callback-promise-utils.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Notes

- This package also supports various other utility functions, including `map`, `reduce`, `any`, `allSettled`, `props`,
  and `each`, which provide powerful tools for managing asynchronous tasks.

## Example Benchmark

```javascript
console.log('Starting Series Tests...');
await testSeries();

console.log('Starting Parallel Tests...');
await testParallel();

console.log('Starting Waterfall Tests...');
await testWaterfall();

console.log('Starting Queue Tests...');
await testQueue();

console.log('Benchmark completed.');
```

## Advanced Features

- **Cancellation Token**: Support for canceling asynchronous operations using a simple token mechanism.
- **Reflection**: Always resolve with an object describing the promise state.

