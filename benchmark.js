const {
    series: customSeries,
    parallel: customParallel,
    waterfall: customWaterfall,
    queue: customQueue,
    map: customMap,
    reduce: customReduce,
    any: customAny,
    some: customSome,
    allSettled: customAllSettled,
    props: customProps,
    each: customEach
} = require('./lib/index');

const async = require('async');
const Bluebird = require('bluebird');
const {waterfall} = require("./lib");

// نمونه تابع Async برای تست
function sampleTask(duration) {
    return new Promise((resolve) => setTimeout(() => resolve(duration), duration));
}

function sampleTaskCallback(duration, callback) {
    setTimeout(() => {
        if (typeof callback === 'function') {
            callback(null, duration);
        } else {
            console.error('Callback is not a function:', callback);
        }
    }, duration);
}

// تعداد تکرارها برای هر تست
const iterations = 1000;

// تست سریال
async function testSeries() {
    console.time('Custom Series');
    for (let i = 0; i < iterations; i++) {
        await customSeries([
            () => sampleTask(10),
            () => sampleTask(20),
            () => sampleTask(30)
        ]);
    }
    console.timeEnd('Custom Series');

    console.time('Async Series');
    for (let i = 0; i < iterations; i++) {
        await new Promise((resolve, reject) => {
            async.series([
                (callback) => sampleTaskCallback(10, callback),
                (callback) => sampleTaskCallback(20, callback),
                (callback) => sampleTaskCallback(30, callback)
            ], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
    console.timeEnd('Async Series');

    console.time('Bluebird Series');
    for (let i = 0; i < iterations; i++) {
        await Bluebird.resolve()
            .then(() => sampleTask(10))
            .then(() => sampleTask(20))
            .then(() => sampleTask(30));
    }
    console.timeEnd('Bluebird Series');
}

// تست موازی
async function testParallel() {
    console.time('Custom Parallel');
    for (let i = 0; i < iterations; i++) {
        await customParallel([
            () => sampleTask(10),
            () => sampleTask(20),
            () => sampleTask(30)
        ]);
    }
    console.timeEnd('Custom Parallel');

    console.time('Async Parallel');
    for (let i = 0; i < iterations; i++) {
        await new Promise((resolve, reject) => {
            async.parallel([
                (callback) => sampleTaskCallback(10, callback),
                (callback) => sampleTaskCallback(20, callback),
                (callback) => sampleTaskCallback(30, callback)
            ], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
    console.timeEnd('Async Parallel');

    console.time('Bluebird Parallel');
    for (let i = 0; i < iterations; i++) {
        await Bluebird.all([
            sampleTask(10),
            sampleTask(20),
            sampleTask(30)
        ]);
    }
    console.timeEnd('Bluebird Parallel');
}

// تست آبشاری
async function testWaterfall() {
    console.time('Custom Waterfall');
    console.log("iterations" + iterations)
    for (let i = 0; i < iterations; i++) {
        const tasks = [
            (callback) => sampleTaskCallback(10, callback),
            (callback) => sampleTaskCallback(20, callback),
            (callback) => sampleTaskCallback(30, callback)
        ];
        await waterfall(tasks);
        // await new Promise((resolve, reject) => {
        //     customWaterfall([
        //         (callback) => sampleTaskCallback(10, callback),
        //         (result1, callback) => sampleTaskCallback(20, callback),
        //         (result2, callback) => sampleTaskCallback(30, callback)
        //     ]).then(resolve).catch(reject);
        // });
    }
    console.timeEnd('Custom Waterfall');

    console.time('Async Waterfall');
    for (let i = 0; i < iterations; i++) {
        const tasks = [
            (callback) => sampleTaskCallback(10, callback),
            (result1, callback) => sampleTaskCallback(20, callback),
            (result2, callback) => sampleTaskCallback(30, callback)
        ];
        await async.waterfall(tasks)
    }
    console.timeEnd('Async Waterfall');

    // Bluebird doesn't have a direct waterfall equivalent, so we'll skip it.
}

// تست صف
async function testQueue() {
    console.time('Custom Queue');
    for (let i = 0; i < iterations; i++) {
        await customQueue([
            () => sampleTask(10),
            () => sampleTask(20),
            () => sampleTask(30)
        ], 2);
    }
    console.timeEnd('Custom Queue');

    console.time('Async Queue');
    for (let i = 0; i < iterations; i++) {
        await new Promise((resolve, reject) => {
            const q = async.queue((task, callback) => {
                sampleTaskCallback(task, callback);
            }, 2);

            q.push([10, 20, 30]);

            q.drain(() => resolve());
        });
    }
    console.timeEnd('Async Queue');
}

async function runTests() {
    console.log('Starting Series Tests...');
    await testSeries();

    console.log('Starting Parallel Tests...');
    await testParallel();

    console.log('Starting Waterfall Tests...');
    await testWaterfall();

    console.log('Starting Queue Tests...');
    await testQueue();

    console.log('Starting Map Tests...');
    await testMap();

    console.log('Starting Reduce Tests...');
    await testReduce();

    console.log('Starting Any Tests...');
    await testAny();

    console.log('Starting Some Tests...');
    await testSome();

    console.log('Starting AllSettled Tests...');
    await testAllSettled();

    console.log('Starting Props Tests...');
    await testProps();

    console.log('Starting Each Tests...');
    await testEach();
}

//////////////////////////////
async function testMap() {
    const items = [1, 2, 3];
    const mapper = (item) => sampleTask(item * 10);

    console.time('Custom Map');
    for (let i = 0; i < iterations; i++) {
        await customMap(items, mapper, 2);
    }
    console.timeEnd('Custom Map');

    console.time('Bluebird Map');
    for (let i = 0; i < iterations; i++) {
        await Bluebird.map(items, mapper, {concurrency: 2});
    }
    console.timeEnd('Bluebird Map');
}

async function testReduce() {
    const items = [1, 2, 3];
    const reducer = (acc, item) => sampleTask(acc + item);

    console.time('Custom Reduce');
    for (let i = 0; i < iterations; i++) {
        await customReduce(items, reducer, 0);
    }
    console.timeEnd('Custom Reduce');

    console.time('Bluebird Reduce');
    for (let i = 0; i < iterations; i++) {
        await Bluebird.reduce(items, reducer, 0);
    }
    console.timeEnd('Bluebird Reduce');
}

async function testAny() {
    const promisesAny = [
        sampleTask(10).then(() => Promise.reject('error1')),
        sampleTask(20).then(() => 'result1'),
        sampleTask(30).then(() => 'result2')
    ];

    console.time('Custom Any');
    for (let i = 0; i < iterations; i++) {
        try {
            await customAny(promisesAny);
        } catch (e) {
        }
    }
    console.timeEnd('Custom Any');

    console.time('Bluebird Any');
    for (let i = 0; i < iterations; i++) {
        try {
            await Bluebird.any(promisesAny);
        } catch (e) {
        }
    }
    console.timeEnd('Bluebird Any');
}


async function testAllSettled() {
    const promisesAllSettled = [
        sampleTask(10).then(() => 'result1'),
        sampleTask(20).then(() => Promise.reject('error1')),
        sampleTask(30).then(() => 'result2')
    ];

    console.time('Custom AllSettled');
    for (let i = 0; i < iterations; i++) {
        await customAllSettled(promisesAllSettled);
    }
    console.timeEnd('Custom AllSettled');

    console.time('Bluebird AllSettled');
    for (let i = 0; i < iterations; i++) {
        await Bluebird.settle(promisesAllSettled);
    }
    console.timeEnd('Bluebird AllSettled');
}

async function testProps() {
    const obj = {
        a: sampleTask(10).then(() => 'result1'),
        b: sampleTask(20).then(() => 'result2'),
        c: sampleTask(30).then(() => 'result3')
    };

    console.time('Custom Props');
    for (let i = 0; i < iterations; i++) {
        await customProps(obj);
    }
    console.timeEnd('Custom Props');

    console.time('Bluebird Props');
    for (let i = 0; i < iterations; i++) {
        await Bluebird.props(obj);
    }
    console.timeEnd('Bluebird Props');
}

async function testEach() {
    const items = [1, 2, 3];
    const iterator = (item) => sampleTask(item * 10);

    console.time('Custom Each');
    for (let i = 0; i < iterations; i++) {
        await customEach(items, iterator);
    }
    console.timeEnd('Custom Each');

    console.time('Bluebird Each');
    for (let i = 0; i < iterations; i++) {
        await Bluebird.each(items, iterator);
    }
    console.timeEnd('Bluebird Each');

    console.log('Benchmark completed.');
}

runTests().catch(err => console.error(err));
