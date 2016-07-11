"use strict";

var walk = require('../walk'),
  nock = require('nock'),
  stdout = require('test-console').stdout,
  assert = require('assert');

describe('walk', function() {
  it('successfully sums issue type counts', function() {
    var testUrl = 'http://api.example.co',
      testIssueType = {
        "id": "/issuetypes/bug",
        "name": "bug",
        "issues": [
          "/issues/1"
        ]
      },
      testIssue = {
        "id": "/issues/1",
        "issuetype": "/issuetypes/bug",
        "description": "Issue #1",
        "estimate": "3"
      };

    var api = nock(testUrl).persist();
    nock(testUrl).persist().get('/issuetypes/bug').once().reply(200, testIssueType);
    nock(testUrl).persist().get('/issues/1').once().reply(200, testIssue);

    var inspect = stdout.inspect();
    walk(testUrl, { types: "bug" });
    inspect.restore();
    assert.deepEqual(inspect.output, ["bug: 3"]);
  })
});