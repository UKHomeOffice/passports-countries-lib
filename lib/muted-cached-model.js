'use strict';

const HmpoCachedModel = require('hmpo-cached-model');

class MutedCachedModel extends HmpoCachedModel {
    /* eslint space-before-function-paren: off */
    logSync /* istanbul ignore next */ () {}
    logSuccess /* istanbul ignore next */ () {}
}

module.exports = MutedCachedModel;

