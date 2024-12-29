const mongoose = require("mongoose");
/* eslint-disable no-param-reassign */


const load = (schema) => {
  /**
   * @typedef {Object} QueryResult
   * @property {Document[]} results - Results found
   * @property {number} page - Current page
   * @property {number} limit - Maximum number of results per page
   * @property {number} totalPages - Total number of pages
   * @property {number} totalResults - Total number of documents
   */
  /**
   * Query for documents with pagination
   * @param {Object} [filter] - Mongo filter
   * @param {Object} [options] - Query options
   * @param {string} [options.sortBy] - Sorting criteria using the format: sortField:(desc|asc). Multiple sorting criteria should be separated by commas (,)
   * @param {string} [options.populate] - Populate data fields. Hierarchy of fields should be separated by (.). Multiple populating criteria should be separated by commas (,)
   * @param {number} [options.limit] - Maximum number of results per page (default = 10)
   * @param {number} [options.page] - Current page (default = 1)
   * @returns {Promise<QueryResult>}
   */
  schema.statics.load = async function (filter, options) {
    let sort = '';
    if (options.sortBy) {
      const sortingCriteria = [];
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
      //console.log(sort)
    } else {
      sort = 'createdAt';
    }

    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;

    const startFromId = options.startFromId;
    const direction = options.direction || 'next';

    // Apply direction-based filter if `startFromId` is provided
    //if (startFromId) {
    //    if (direction === 'next') {
    //        if (options.order === 'asc') {
    //          filter._id = { $gt: new mongoose.Types.ObjectId(startFromId) };
    //        } else {
    //          console.log('next desc', startFromId)
    //          filter._id = { $lt: new mongoose.Types.ObjectId(startFromId) };
    //        }            
    //    } else if (direction === 'prev') {
    //        if (options.order === 'asc') {
    //          filter._id = { $lt: new mongoose.Types.ObjectId(startFromId) };                
    //        } else {
    //          filter._id = { $gt: new mongoose.Types.ObjectId(startFromId) };
    //        }
    //        //sort = sort.startsWith('-') ? sort.slice(1) : `-${sort}`;
    //    }
    //}

    //console.log('---', JSON.stringify(filter, null, 2), sort)
        
    const countPromise = this.countDocuments(filter).exec();
    let docsPromise = this.find(filter).sort(sort).limit(limit);

    if (options.populate) {
      options.populate.split(',').forEach((populateOption) => {
        //const ppp = populateOption
        //    .split('.')
        //    .reverse()
        //    .reduce((a, b) => ({ path: b.trim(), populate: a.trim() }))
        //console.log(ppp)
        docsPromise = docsPromise.populate(populateOption.trim());
      });
    }

    docsPromise = docsPromise.exec();

    const [totalResults, results] = await Promise.all([countPromise, docsPromise]);

    let remainingCount = 0;
    if (results.length > 0) {
        
        remainingCount = totalResults - results.length
        // Calculate remaining records after the last result's `_id`
        //const remainingFilter = { ...filter, _id: { $gt: lastId } };
        //remainingCount = await this.countDocuments(remainingFilter).exec();
    }

    const result = {
        results,        
        totalResults,
        remainingCount, // Added remaining count here
    };

    return result;
  };
};

module.exports = load;
