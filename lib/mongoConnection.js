'use strict';

const assert = require('assert');
const mongo = require('mongodb');
const ObjectId = mongo.ObjectID;

class MongoConnection {
    constructor(_opts) {
        this.config = _opts;

        this.cache = {};
    }

    connect() {
        if (this._connection) {
            return Promise.resolve(this._connection);
        }

        const conStr = `mongodb://${ this.config.host }:${ this.config.port }/${ this.config.db }`;

        this._connection = mongo.connect(conStr);

        return this._connection.then((db) => {
            this.db = db;

            return db;
        });
    }

    populateCollections() {
        return this.db.listCollections().toArray().then((collections) => {
            this.collections = collections;

            return collections;
        });
    }

    getInitialOID(query) {
        return function _getInitialOID() {
            assert(typeof query === 'string', 'query should be a string');

            /* given a query of "col:something:is:funny", this would return:
            [
                "col:something:is:funny", // the whole string technically matched
                "col", // the collection name
                "something", // the key/field name extracted
                "is:funny" // everything else, in this case a plain ol' string
            ]
            */
            const splitQuery = query.match(/(.*){1}:(.*){1}:(.*)/);

            assert(splitQuery.length === 4, 'query should be in format of `collection:key:query`');

            const searchCol = splitQuery[1];
            const searchKey = splitQuery[2];

            let searchVal = {};

            // allow searching by ObjectId through mongo-esque syntax
            const objIdStr = 'ObjectId(';

            if (splitQuery[3].substr(0, objIdStr.length) === objIdStr) {
                const oidval = splitQuery[3].replace(
                    // yank what's inside the ObjectId string
                    /(ObjectId\()?("|')?(.*)+(("|')\))+?/,
                    '$3'
                );

                searchVal[searchKey] = new ObjectId(oidval);
            } else {
                searchVal[searchKey] = splitQuery[3];
            }

            if (searchKey === '_id') {
                return Promise.resolve(searchVal);
            }

            try {
                searchVal[searchKey] = JSON.parse(searchVal);
            } catch (e) {
                if (! e instanceof SyntaxError) {
                    throw e;
                }
            }

            return this.db.collection(searchCol).findOne(searchVal);
        }.bind(this);
    }
};

MongoConnection.prototype.findInAnyCollection = require('./findOID');
MongoConnection.prototype.recursiveOIDSearch = require('./treeSearch');

module.exports = MongoConnection;

