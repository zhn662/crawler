var async = require('async');
var moment = require('moment');
var utils = require('./utils');
var config = require('../config');
var require = patchRequire(require);
var Crawler = require('./crawler');

var exports = {
    // 获取需要处理的抓取任务队列
    getTasks : function(params) {
        var tasks = [];

        var crawlType = params && params['action'] ? params['action'] : 'crawlPage';
        delete params['action'];
        var crawlInfo = params || config.crawler.basicInfo.crawlInfo;
        var pageTypes = config.crawler.basicInfo.pageTypes;
        for (var site in crawlInfo) {
            crawlInfo[site].forEach(function(type, index) {
                pageTypes.forEach(function(pageType) {
                    var task = function(callback) {
                        var param = {
                            siteName : site,
                            dataType : type,
                            pageType : pageType,
                            crawlType : crawlType
                        };

                        var crawler = new Crawler(param);
                        crawler.crawlStart(function(items) {
                            var name = site + '_' + type;
                            name += '_' + pageType.replace('Page', '');
                            name += '_' + crawlType.replace('crawl', '');
                            name = name.toLowerCase();

                            callback(null, name);
                        });
                    };

                    tasks.push(task);
                });
            });
        }

        return tasks;
    },
    execTasks : function(params, callback) {
        var tasks = this.getTasks(params);
        async.series(tasks, function(err, results) {
            utils.log('tasks done: ' + JSON.stringify(results));
            callback();
            utils.exitCasper();
        });
    }
};

module.exports = exports;
