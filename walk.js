'use strict';

var _ = require('lodash'),
  URL = require('url'),
  restler = require('restler'),
  Q = require('q');

/*
  Main method that:
  - for a given root URL, hits the /issuetypes/ route for the given issue types and gets their JSON
  - based on what issues are in each issuetype's "issue" key, gets each of their JSON
  - sums up each issuetype's "estimate" and outputs it.
  @param {String} url - root URL to to hit
  @param {Object} options - options hash passed in by commander
  @option {String} types - list of issuetypes to get e.g. "bug", "bug|story"
 */
function walk(url, options) {
  var parsed = URL.parse(url, true, true);
  var issueTypes = _.split(options.types, '|');
  var connOptions = {
    headers: { 'Accept': 'application/json' }
  };

  var promises = getIssueTypes();
  Q.allSettled(promises).then(function(results) {
    return getPromiseResults(results);
  }).then(fetchIssues);

  /////////////////////////////////////////////////// Helper methods ///////////////////////////////////////////////////

  /*
    Queries the /issuetypes/ route for the given issue types.
   */
  function getIssueTypes() {
    return _.map(issueTypes, function(type) {
      var fullUrl = parsed.href + 'issuetypes/' + type;
      return fetchGetPromise(fullUrl);
    });
  }

  /*
    Callback that handles parsing the issuetypes JSON objects and figuring out which issues to then fetch.
    @param {Array<Object>} array - array of issuetypes JSON objects
   */
  function fetchIssues(array) {
    var issueList = _.flatten(_.map(array, function(x) {
      return x['issues'];
    }));

    var issuePromises = getIssues(issueList);
    Q.allSettled(issuePromises).then(function(results) {
      return getPromiseResults(results);
    }).then(parseAndProcessIssues);
  }

  /*
    Callback that sums up issue "estimate" counts by issuetype and then prints them out.
    @param {Array} issuesArray - array of issues JSON objects
   */
  function parseAndProcessIssues(issuesArray) {
    var counts = _.reduce(issuesArray, function(result, issueJSON) {
      var issueType = issueJSON['issuetype'].match(/\/(\w+)$/)[1];
      result[issueType] = result[issueType] || 0;

      result[issueType] += parseInt(issueJSON['estimate']);

      return result;
    }, {});

    return listIssuetypeCounts(counts);
  }

  /*
    Queries the /issues/:id route for the given paths.
    @param {Array<String>} issues - array of issue paths
   */
  function getIssues(issues) {
    return _.map(issues, function(issuePath) {
      var fullUrl = parsed.href + issuePath.slice(1);
      return fetchGetPromise(fullUrl);
    });
  }

  /*
    Prints out the issue typea and their estimate totals.
    @param {Object} hash
   */
  function listIssuetypeCounts(hash) {
    for (var key in hash) console.log(key + ': ' + hash[key]);
  }

  /*
    Helper that extracts the JSON from the promises.
    @param {Array<Promise>} promiseArray
   */
  function getPromiseResults(promiseArray) {
    return _.map(promiseArray, function(x) { return x.value; })
  }

  /*
    Helper that returns the promise for the request to the given URL.
    @param {String} url
   */
  function fetchGetPromise(url) {
    return Q.promise(function(resolve) {
      restler.get(url, connOptions).on('complete', function(result, response) {
        if (response === null || response.statusCode !== 200 ) {
          console.log("Non-200 response! Please make sure the given URL is correct.");
          process.exit(1);
        } else {
          resolve(result);
        }
      });
    })
  }
}

module.exports = walk;