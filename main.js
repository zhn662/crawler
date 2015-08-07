var task = require('./lib/core/task');
var utils = require('./lib/core/utils');

task.execTasks(utils.getParams(), function() {
    utils.log('task.execTasks completed ...');
});
