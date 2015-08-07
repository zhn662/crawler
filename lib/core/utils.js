var fs = require('fs');
var moment = require('moment');
var config = require('../config');
var require = patchRequire(require);
var casper = require('casper').create();

var exports = {
    // 格式化输出LOG信息
    log : function() {
        var conf = config.crawler.basicInfo;
        var message = moment().format('HH:mm:ss.SSS') + ' >> ';
        message += [].slice.call(arguments, 0).join(', ');

        if (conf.debug) {
            console.log(message);
        }
        if (conf.saveLog) {
            this.saveFile(conf.logPath + 'log_' + moment().format('YYMMDD') + '.log', message + '\r\n', 'a');
        }
    },
    // 退出CASPER执行环境
    exitCasper : function() {
        casper.exit();
    },
    // 获取CASPER_CLI命令行参数值
    hasParam : function(name) {
        return casper.cli.has(name);
    },
    // 获取CASPER_CLI命令行参数值
    getParam : function(name) {
        return casper.cli.get(name);
    },
    // 获取CLI命令行中指定的站点及类型参数信息
    getParams : function() {
        var params = {};
        if (this.hasParam('action')) {
            params['action'] = this.getParam('action');
        }
        if (this.hasParam('sites')) {
            var sites = this.getParam('sites').split(',');
            var types = this.hasParam('types') && this.getParam('types') ? this.getParam('types').split(',') : [];
            var crawlInfo = config.crawler.basicInfo.crawlInfo;

            if (sites.length > 0) {
                sites.forEach(function(site, index) {
                    for (var key in crawlInfo) {
                        if (key == site) {
                            if (types.length > 0) {
                                params[site] = types;
                            } else {
                                params[site] = crawlInfo[site];
                            }
                            break;
                        }
                    }
                });
            }
        }
        if (Object.keys(params).length == 0) {
            params = null;
        }
        return params;
    },
    // 获取正则匹配项内容$1
    getMatchData : function(input, pattern) {
        var regex = new RegExp(pattern, 'g');
        var matches = regex.exec(input);
        if (matches && matches.length > 0) {
            return matches[1];
        } else {
            return null;
        }
    },
    // 保存内容到本地文件
    saveFile : function(path, content, mode) {
        fs.write(path, content, mode);
    },
    inherits : function(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
            constructor : {
                value : ctor,
                enumerable : false,
                writable : true,
                configurable : true
            }
        });
    }
};

module.exports = exports;
