'use strict';

const ObjectId = require('mongodb').ObjectID;

function mapJoinFields(found) {
    return found.filter((ele) => {
        return !!ele.data;
    }).map((col) => {
        return Object.assign({
            joinFields: Object.keys(col.data).filter((key) => {
                return key !== '_id' && col.data[key] instanceof ObjectId;
            }),
        }, col);
    });
}

module.exports = function recursiveOIDSearch(_oid, isTopLevel) {
    const oid = _oid instanceof ObjectId ? _oid : ObjectId(_oid);

    return this.findInAnyCollection.call(this, oid, isTopLevel).then((_found) => {
        const found = mapJoinFields(_found);

        if (!found.length) {
            return Promise.reject(`ObjectId ${ oid } not found in any collections`);
        }

        return Promise.all(found.map((ele) => {
            return Promise.all(ele.joinFields.map((jf) => {
                return recursiveOIDSearch.call(this, ele.data[jf]).then((data) => {
                    return data;
                }).catch(() => {
                    return `ObjectId("${ ele.data[jf].toString() }")`;
                });
            })).then((_jfs) => {
                const jfs = _jfs.map((jfsele) => {
                    if (!jfsele || !Array.isArray(jfsele)) {
                        return jfsele;
                    }

                    return jfsele.filter((nestedElement) => {
                        return !!nestedElement;
                    })[0];
                });

                ele.joinFields.forEach((jf, iter) => {
                    if (typeof jfs[iter] !== 'undefined') {
                        ele.data[jf] = jfs[iter];
                    }
                });

                if (this.config.debug) {
                    return ele;
                } else {
                    return ele.data;
                }
            }).catch(console.error.bind(console));
        }));
    });
};

