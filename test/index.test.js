const {expect} = require('chai');
const {
    callbackToPromise,
    promiseToCallback,
    series,
    parallel,
    waterfall,
    queue,
    map,
    reduce,
    any,
    some,
    allSettled,
    props,
    each
} = require('../lib');

// Sample callback function for testing
function exampleCallbackFunc(a, b, callback) {
    if (a < 0 || b < 0) {
        return callback(new Error('Negative numbers are not allowed'));
    }
    callback(null, a + b);
}

// Sample promise function for testing
function examplePromiseFunc(a, b) {
    return new Promise((resolve, reject) => {
        if (a < 0 || b < 0) {
            return reject(new Error('Negative numbers are not allowed'));
        }
        resolve(a + b);
    });
}

describe('callbackToPromise', () => {
    it('should convert a callback function to a promise', async () => {
        const promiseFunc = callbackToPromise(exampleCallbackFunc);
        const result = await promiseFunc(1, 2);
        expect(result).to.equal(3);
    });

    it('should reject the promise if an error occurs', async () => {
        const promiseFunc = callbackToPromise(exampleCallbackFunc);
        try {
            await promiseFunc(-1, 2);
        } catch (error) {
            expect(error.message).to.equal('Negative numbers are not allowed');
        }
    });
});

describe('promiseToCallback', () => {
    it('should convert a promise function to a callback', (done) => {
        const callbackFunc = promiseToCallback(examplePromiseFunc);
        callbackFunc(1, 2, (err, result) => {
            expect(err).to.be.null;
            expect(result).to.equal(3);
            done();
        });
    });

    it('should return an error if the promise is rejected', (done) => {
        const callbackFunc = promiseToCallback(examplePromiseFunc);
        callbackFunc(-1, 2, (err, result) => {
            expect(err).to.be.an('error');
            expect(err.message).to.equal('Negative numbers are not allowed');
            expect(result).to.be.undefined;
            done();
        });
    });
});

describe('series', () => {
    it('should execute tasks in series', async () => {
        const tasks = [
            () => examplePromiseFunc(1, 2),
            () => examplePromiseFunc(3, 4),
            () => examplePromiseFunc(5, 6)
        ];
        const results = await series(tasks);
        expect(results).to.deep.equal([3, 7, 11]);
    });
});

describe('parallel', () => {
    it('should execute tasks in parallel', async () => {
        const tasks = [
            () => examplePromiseFunc(1, 2),
            () => examplePromiseFunc(3, 4),
            () => examplePromiseFunc(5, 6)
        ];
        const results = await parallel(tasks);
        expect(results).to.deep.equal([3, 7, 11]);
    });
});

describe('waterfall', () => {
    it('should execute tasks in waterfall', async () => {
        const tasks = [
            (callback) => callback(null, 1 + 2),
            (callback) => callback(null, 3 + 4),
            (callback) => callback(null, 5 + 6)
        ];
        const results = await waterfall(tasks);
        expect(results).to.deep.equal([3, 7, 11]);
    });
});

describe('queue', () => {
    it('should execute tasks in queue with concurrency', async () => {
        const tasks = [
            () => examplePromiseFunc(1, 2),
            () => examplePromiseFunc(3, 4),
            () => examplePromiseFunc(5, 6)
        ];
        const results = await queue(tasks, 2);
        expect(results).to.deep.equal([3, 7, 11]);
    });
});
//////////////////////////////

describe('map', () => {
    it('should map tasks with concurrency control', async () => {
        const items = [1, 2, 3];
        const mapper = (item) => examplePromiseFunc(item, 1);
        const results = await map(items, mapper, 2);
        expect(results).to.deep.equal([2, 3, 4]);
    });
});

describe('reduce', () => {
    it('should reduce tasks sequentially', async () => {
        const items = [1, 2, 3, 4, 5];
        const reducer = (accumulator, item) => examplePromiseFunc(accumulator, item);
        const result = await reduce(items, reducer, 0);
        expect(result).to.equal(15);
    });
});

describe('any', () => {
    it('should return the value of the first resolved promise', async () => {
        const promises = [
            Promise.reject('error1'),
            Promise.resolve('result1'),
            new Promise(resolve => setTimeout(resolve, 100, 'result2'))
        ];
        const result = await any(promises);
        expect(result).to.equal('result1');
    });

    it('should reject if all promises are rejected', async () => {
        const promises = [
            Promise.reject('error1'),
            Promise.reject('error2')
        ];
        try {
            await any(promises);
        } catch (err) {
            expect(err).to.be.an('error');
        }
    });
});


describe('allSettled', () => {
    it('should return results of all promises', async () => {
        const promises = [
            Promise.resolve('result1'),
            Promise.reject('error1')
        ];
        const results = await allSettled(promises);
        expect(results).to.deep.equal([
            {status: 'fulfilled', value: 'result1'},
            {status: 'rejected', reason: 'error1'}
        ]);
    });
});

describe('props', () => {
    it('should resolve a map of promises to a map of resolved values', async () => {
        const obj = {
            a: examplePromiseFunc(1, 1),
            b: examplePromiseFunc(2, 2),
            c: examplePromiseFunc(3, 3)
        };
        const result = await props(obj);
        expect(result).to.deep.equal({
            a: 2,
            b: 4,
            c: 6
        });
    });
});

describe('each', () => {
    it('should execute tasks sequentially', async () => {
        const items = [1, 2, 3];
        const results = [];
        await each(items, async (item) => {
            const result = await examplePromiseFunc(item, 1);
            results.push(result);
        });
        expect(results).to.deep.equal([2, 3, 4]);
    });
});
