'use strict';

const HmpoCachedModel = require('hmpo-cached-model');

class MutedCachedModel extends HmpoCachedModel {
    logSync() {}
    logSuccess() {}
}

module.exports = MutedCachedModel;

