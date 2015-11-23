'use strict';

module.exports = function findInAnyCollection(oid, isTopLevel) {
    const oidStr = oid.toString();

    if (!isTopLevel && this.cache[oidStr]) {
        return Promise.resolve([this.cache[oidStr]]);
    }

    const collections = this.collections.map((col) => {
        return col.name;
    });

    return Promise.all(collections.map((col) => {
        return this.db.collection(col).findOne({
            _id: oid,
        }).then((data) => {
            let ret = {
                accessed: new Date(),
                db: this.db,
                collection: col,
                data: data,
            };

            if (!this.config.debug) {
                this.cache[oidStr] = ret;
            }

            return ret;
        });
    }));
};

