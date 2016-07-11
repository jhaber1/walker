#!/usr/bin/env node
'use strict';

var program = require('commander'),
  walk = require('./walk');

program
  .arguments('<url>')
  .description('Queries an API and outputs issue counts by issue type')
  .option('--types <required>', 'list of issue types to traverse e.g. bug, "bug|story|task" -- MAKE SURE TO WRAP IN QUOTES OR TO ESCAPE THE PIPE CHARACTERS!')
  .action(function(url, options) {
    debugger;
    if (typeof options.types === 'undefined') {
      console.log("No --types given! See 'walker --help' for the syntax.");
      process.exit(1);
    }

    walk(url, options);
  })
  .parse(process.argv);

if (program.args.length === 0) program.help();