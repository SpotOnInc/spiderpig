'use strict';

const assert = require('assert');
const minimist = require('minimist');

const MongoConnection = require('./mongoConnection');

function jsonFormatter(key, val) {
    if (key === 'db' && val.s && val.s.databaseName) {
        return undefined;
    }

    return val;
}

module.exports = function main(argv) {
    const defaults = {
        search: null,
        debug: false,
        port: 27017,
        host: 'localhost',
    };

    const args = minimist(argv, { default: defaults, boolean: ['debug', 'mongodump'] });

    assert(args.search, 'must provide a search query in the format of `collection:field:query`');
    assert(args.spiderdb, 'must provide a db name');

    if (typeof v8debug !== 'undefined') {
        args.debug = true;
    }

    const mc = new MongoConnection({
        db: args.spiderdb,
        host: args.host,
        port: args.port,
        debug: args.debug,
    });

    mc.connect()
        .then(mc.populateCollections.bind(mc))
        .then(mc.getInitialOID.call(mc, args.search))
        .then((result) => {
            assert(result, `could not match search query ${ args.search }`);

            const oid = result._id;

            return mc.recursiveOIDSearch.call(mc, oid, true);
        }).then((found) => {
            /*eslint-disable no-console-log/no-console-log*/
            console.log(JSON.stringify(found, jsonFormatter, '\t'));
            /*eslint-enable no-console-log/no-console-log*/

            mc.db.close();

            process.exit(0);
        }).catch((err) => {
            console.error(err);

            mc.db.close();

            process.exit(1);
        });
};

