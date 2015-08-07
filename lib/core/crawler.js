var async = require('async');
var moment = require('moment');
var __ = require('underscore');
var utils = require('./utils');
var config = require('../config');
var require = patchRequire(require);

function Crawler(params) {
    if (!params.siteName || !params.dataType || !params.pageType || !params.crawlType) {
        utils.log('crawl params are not provided!');
        this.exitCasper();
        return;
    }

    var siteInfo = config.crawler.siteInfo;
    if (!siteInfo || !siteInfo[params.siteName] || !siteInfo[params.siteName][params.dataType]) {
        utils.log('crawl config params are not defined!');
        this.exitCasper();
        return;
    }

    this.siteName = params.siteName;
    this.dataType = params.dataType;
    this.pageType = params.pageType;
    this.crawlType = params.crawlType;
    this.crawlEnabled = siteInfo[params.siteName][params.dataType].enabled;

    this.siteInfo = siteInfo[this.siteName][this.dataType];
    this.basicInfo = this.siteInfo.basicInfo;
    this.detailInfo = this.siteInfo.detailInfo;

    this.pageCount = 0;
    this.itemCount = 0;
    this.itemsQueue = [];
    this.threadLimit = this.siteInfo.threadLimit || 5;
}

Crawler.prototype = {
    // 获取列表页首页URL地址
    getStartPage : function() {
        if (this.siteInfo.pageNumDiff === undefined) {
            return this.siteInfo[this.pageType].replace('pagenum', 1);
        } else {
            return this.siteInfo[this.pageType].replace('pagenum', 1 - this.siteInfo.pageNumDiff);
        }
    },
    // 设置列表页总页数
    setPageCount : function(casper) {
        this.pageCount = this.getPageCount(casper);
    },
    // 获取列表页总页数
    getPageCount : function(casper) {
        var pageCount = casper.evaluate(function(siteInfo) {
            return $(siteInfo.pageCount).text();
        }, this.siteInfo);
        if (pageCount && pageCount.search(/^\d+$/) === -1) {
            pageCount = 0;
        } else {
            pageCount = pageCount > this.siteInfo.maxPageLimit ? this.siteInfo.maxPageLimit : pageCount;
        }
        return pageCount || 0;
    },
    // 设置列表页单页节目数
    setItemCount : function(casper) {
        this.itemCount = this.getItemCount(casper);
    },
    // 获取列表页单页节目数
    getItemCount : function(casper) {
        var itemCount = casper.evaluate(function(siteInfo) {
            return $(siteInfo.videoItem).length;
        }, this.siteInfo);
        return itemCount || 0;
    },
    // 获取列表页所有页URL地址
    getPagesQueue : function(callback) {
        var _this = this;

        var casper = this.getCasper();
        casper.start(this.getStartPage(), function() {
            _this.setPageCount(casper);
            _this.setItemCount(casper);

            var pagesQueue = [];
            var pageCount = _this.pageCount;
            for (var pageNum = 1; pageNum <= pageCount; pageNum++) {
                pagesQueue.push({
                    pageIndex : pageNum,
                    pageType : _this.pageType,
                    pageUrl : _this.siteInfo[_this.pageType].replace('pagenum', pageNum)
                });
            }
            callback(pagesQueue);
        });
        casper.run(function() {
        });
    },
    // 获取列表页所有需要抓取的节目项
    getItemsQueue : function(callback) {
        var _this = this;

        var task1 = function(callback1) {
            _this.getPagesQueue(function(items) {
                callback1(null, items);
            });
        };
        var task2 = function(items, callback2) {
            if (items && items.length > 0) {
                var queue = [];
                async.eachLimit(items, _this.threadLimit, function(item, cb) {
                    _this.getItemsInfo(item, function(arr) {
                        queue = queue.concat(arr);
                        cb(null, null);
                    });
                }, function(err) {
                    if (err) {
                        utils.log("err: " + err);
                    }
                    callback2(null, queue);
                });
            } else {
                callback2(null, null);
            }
        };
        var task3 = function(items, callback3) {
            utils.log('************************************************************');
            utils.log(['siteName: ' + _this.siteName, 'dataType: ' + _this.dataType, 'pageType: ' + _this.pageType].join(', '));
            utils.log(['threadLimit: ' + _this.threadLimit, 'pageCount: ' + _this.pageCount, 'itemCount: ' + _this.itemCount, 'itemsQueue: ' + items.length].join(', '));
            utils.log('************************************************************\n');

            callback3(null, items);
        };

        async.waterfall([task1, task2, task3], function(err, items) {
            if (err) {
                utils.log("err: " + err);
            }
            if (items) {
                items = __.sortBy(items, function(item) {
                    return item.itemInfo.itemIndex;
                });
                _this.itemsQueue = items;
            }

            callback(items);
        });
    },

    // 获取列表页单页所有节目的相关信息
    getItemsInfo : function(item, callback) {
        if (!item || !item.pageUrl) {
            utils.log('pageUrl not exist ...');
            return;
        }

        var _this = this;
        var casper = this.getCasper();
        casper.start(item.pageUrl, function() {
            var ret = _this.getItemsVideoObj(casper, item);

            callback(ret);
        }).then(function() {
            casper.page.close();
        });
        casper.run(function() {
        });
    },
    // 获取列表页单页所有的节目信息
    getItemsVideoObj : function(casper, item) {
        var ret = [];
        var _this = this;

        // 标记需要排除掉的节目
        var videoExcludes = casper.evaluate(function(func, siteInfo) {
            return func(siteInfo);
        }, _this.getItemsVideoExclude, _this.siteInfo);

        // 获取所有节目名称
        var videoNames = casper.evaluate(function(func, siteInfo) {
            return func(siteInfo);
        }, _this.getItemsVideoName, _this.siteInfo);

        // 获取所有节目主页面地址
        var indexPages = casper.evaluate(function(func, siteInfo) {
            return func(siteInfo);
        }, _this.getItemsIndexPage, _this.siteInfo);

        if (_this.crawlType !== 'crawlRank') {
            // 获取所有节目海报
            var imageUrls = casper.evaluate(function(func, siteInfo) {
                return func(siteInfo);
            }, _this.getItemsImageUrl, _this.siteInfo);

            // 获取所有节目基本信息
            var basicInfos = casper.evaluate(function(func, siteInfo) {
                return func(siteInfo);
            }, _this.getItemsBasicInfo, _this.siteInfo);
        }

        // 生成所有节目排序等信息
        if (videoNames.length > 0 && videoNames.length === indexPages.length) {
            videoNames.forEach(function(name, index) {
                // 过滤掉非正片项
                if (name && !videoExcludes[index]) {
                    var video = {
                        videoName : name,
                        indexPage : indexPages[index]
                    };

                    // 抓取排序值时过滤掉以下项
                    if (_this.crawlType !== 'crawlRank') {
                        video.imageUrl = imageUrls ? imageUrls[index] : null;
                        video.basicInfo = basicInfos ? basicInfos[index] : null;
                        video.detailInfo = null;
                    }

                    video.itemInfo = {
                        itemType : item.pageType,
                        itemIndex : (item.pageIndex - 1) * videoNames.length + index + 1
                    };

                    ret.push(video);
                }
            });
        }

        return ret;
    },
    // 标记列表页单页所有需要排除掉的节目
    getItemsVideoExclude : function(siteInfo) {
        var videoExcludes = [];
        $(siteInfo.videoItem).each(function() {
            var excludeFlag = $(this).find(siteInfo.videoExclude).length ? true : false;
            videoExcludes.push(excludeFlag);
        });
        return videoExcludes;
    },
    // 获取列表页单页所有节目的节目名称
    getItemsVideoName : function(siteInfo) {
        var videoNames = [];
        $(siteInfo.videoItem).find(siteInfo.videoName).each(function() {
            videoNames.push($(this).text());
        });
        return videoNames;
    },
    // 获取列表页单页所有节目的节目海报
    getItemsImageUrl : function(siteInfo) {
        var imageUrls = [];
        $(siteInfo.videoItem).find(siteInfo.imageUrl).each(function() {
            imageUrls.push($(this).attr('src'));
        });
        return imageUrls;
    },
    // 获取列表页单页所有节目的主页面地址
    getItemsIndexPage : function(siteInfo) {
        var indexPages = [];
        $(siteInfo.videoItem).find(siteInfo.indexPage).each(function() {
            indexPages.push($(this).attr('href'));
        });
        return indexPages;
    },
    // 获取列表页单页所有节目的基本信息
    getItemsBasicInfo : function(siteInfo) {
        var basicInfos = [];

        $(siteInfo.videoItem).each(function() {
            var obj = {};

            for (var key in siteInfo.basicInfo) {
                if (siteInfo.basicInfo[key]) {
                    var ret = null;
                    var infoItem = siteInfo.basicInfo[key];

                    switch (key) {
                    case 'director':
                    case 'actor':
                    case 'region':
                    case 'category':
                        ret = $(this).find(infoItem).map(function(index, item) {
                            return $(this).text();
                        });
                        ret = [].slice.call(ret, 0);
                        break;

                    case 'publishTime':
                    case 'description':
                        ret = $(this).find(infoItem).text();
                        break;
                    default:
                        break;
                    }

                    if (ret) {
                        obj[key] = ret;
                    }
                }
            }

            if (_.keys(obj).length > 0) {
                basicInfos.push(obj);
            }
        });

        return basicInfos;
    },

    // 获取节目详情页 海报信息
    getDetailImageUrl : function(detailInfo) {
        return $(detailInfo.imageUrl).attr('src');
    },
    // 获取节目详情页 导演信息
    getDetailDirector : function(detailInfo) {
        return null;
    },
    // 获取节目详情页 主演信息
    getDetailActor : function(detailInfo) {
        return null;
    },
    // 获取节目详情页 地区信息
    getDetailRegion : function(detailInfo) {
        return null;
    },
    // 获取节目详情页 类别信息
    getDetailCategory : function(detailInfo) {
        return null;
    },
    // 获取节目详情页 上映日期信息
    getDetailPublishTime : function(detailInfo) {
        return null;
    },
    // 获取节目详情页 描述信息
    getDetailDescription : function(detailInfo) {
        var description = null;

        description = $(detailInfo.description).html();
        description = description.replace(/<.*?>.*?<\/.*?>|&nbsp;/g, '');
        description = description.trim();

        return description;
    },
    // 获取节目详情页 总集数信息
    getDetailEpisodeCount : function(detailInfo) {
        return 0;
    },
    // 获取节目详情页 剧集信息
    getDetailEpisodeItem : function(detailInfo) {
        return null;
    },
    // 获取单个节目详细页的信息（含剧集信息）
    getDetailInfo : function(item, callback) {
        if (!item || !item.indexPage) {
            utils.log('indexPage not exist ...');
            return;
        }

        var _this = this;
        var casper = this.getCasper();
        casper.start(item.indexPage, function() {
            // 获取详情页 海报地址
            var imageUrl = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailImageUrl, _this.detailInfo);

            // 获取详情页 导演
            var director = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailDirector, _this.detailInfo);

            // 获取详情页 主演
            var actor = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailActor, _this.detailInfo);

            // 获取详情页 地区
            var region = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailRegion, _this.detailInfo);

            // 获取详情页 分类
            var category = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailCategory, _this.detailInfo);

            // 获取详情页 上映日期
            var publishTime = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailPublishTime, _this.detailInfo);

            // 获取详情页 描述
            var description = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailDescription, _this.detailInfo);

            // 获取详情页 总集数
            var episodeCount = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailEpisodeCount, _this.detailInfo);

            // 获取详情页 剧集
            var episodeItem = casper.evaluate(function(func, detailInfo) {
                return func(detailInfo);
            }, _this.getDetailEpisodeItem, _this.detailInfo);
            if (episodeItem) {
                episodeItem = __.sortBy(episodeItem, function(item) {
                    return item.episodeNum;
                });
            }

            item.detailInfo = {
                imageUrl : imageUrl || null,
                director : director || null,
                actor : actor || null,
                region : region || null,
                category : category || null,
                publishTime : publishTime || '1970-01-01',
                description : description || null,
                episodeCount : episodeCount || 0,
                episodeItem : episodeItem || null
            };

            callback(item);
        }).then(function() {
            casper.page.close();
        });
        casper.run(function() {
        });
    },

    // 创建CASPER实例
    getCasper : function() {
        var options = config.casper;
        if (this.siteInfo && this.siteInfo.userAgent) {
            options.userAgent = this.siteInfo.userAgent;
        }

        return require('casper').create(options);
    },
    // 退出CASPER执行环境
    exitCasper : function() {
        this.getCasper().exit();
    },
    // 初始化队列处理对象
    initQueue : function(callback) {
        var queue = async.queue(function(task, cb) {
            utils.log('task #' + task.index + ' : processing');
            task.execute(task, cb);
        }, this.threadLimit);
        queue.saturated = function() {
            utils.log('all workers to be used');
        };
        queue.empty = function() {
            setTimeout(function() {
                utils.log('no more tasks wating');
            }, 3000);
        };
        queue.drain = function() {
            setTimeout(function() {
                utils.log('all tasks have been processed\n\n');
                callback();
            }, 5000);
        };

        return queue;
    },
    // 抓取初始化
    crawlInit : function() {
        var prototypes = require('./' + this.siteName + '/' + this.dataType);
        for (var key in prototypes) {
            if (prototypes.hasOwnProperty(key)) {
                Crawler.prototype[key] = prototypes[key];
            }
        }
    },
    // 抓取调用入口
    crawlStart : function(callback) {
        if (!this.crawlEnabled) {
            utils.log(this.siteName + '(' + this.dataType + ') crawl disabled!\n');
            callback();
        } else {
            this.crawlInit();

            switch (this.crawlType) {
            case 'crawlPage':
                this.crawlPage(callback);
                break;
            case 'crawlRank':
                this.crawlRank(callback);
                break;
            default:
                break;
            }
        }
    },
    // 抓取节目排序信息
    crawlRank : function(callback) {
        var _this = this;

        var task1 = function(callback1) {
            _this.getItemsQueue(function(items) {
                callback1(null, items);
            });
        };
        var task2 = function(items, callback2) {
            if (items && items.length > 0) {
                callback2(null, items);
            } else {
                callback2(null, null);
            }
        };

        async.waterfall([task1, task2], function(err, items) {
            if (err) {
                utils.log("err: " + err);
            }
            if (items) {
                items = __.sortBy(items, function(item) {
                    return item.itemInfo.itemIndex;
                });

                // 保存所有节目信息 用以DEBUG
                if (config.crawler.basicInfo.saveLog) {
                    var date = moment().format('YYMMDD');
                    var hour = moment().format('HH');
                    var name = _this.siteName + '_' + _this.dataType;
                    name += '_' + _this.pageType.replace('Page', '');
                    name += '_' + _this.crawlType.replace('crawl', '') + '.log';
                    var path = config.crawler.basicInfo.logPath + date + '/' + hour + '/' + name.toLowerCase();
                    utils.saveFile(path, JSON.stringify(items), 'w');
                }
            }

            callback(items);
        });
    },
    // 抓取节目详细信息
    crawlPage : function(callback) {
        var _this = this;

        var task1 = function(callback1) {
            _this.getItemsQueue(function(items) {
                callback1(null, items);
            });
        };
        var task2 = function(items, callback2) {
            if (items && items.length > 0) {
                callback2(null, items);
            } else {
                callback2(null, null);
            }
        };
        var task3 = function(items, callback3) {
            if (!items || items.length === 0) {
                callback3(null, null);
            } else {
                var ret = [];

                var queue = _this.initQueue(function() {
                    callback3(null, ret);
                });
                var execute = function(task, cb) {
                    setTimeout(function() {
                        _this.getDetailInfo(task.item, function(item) {
                            ret.push(item);
                            cb(null, null);
                        });
                    }, 0);
                };
                items.forEach(function(item, index) {
                    queue.push({
                        item : item,
                        index : index,
                        name : 'task' + index,
                        execute : execute
                    }, function(err) {
                        if (err) {
                            utils.log("err: " + err);
                        }
                        utils.log('task #' + index + ' : executed');
                    });
                });
            }
        };

        async.waterfall([task1, task2, task3], function(err, items) {
            if (err) {
                utils.log("err: " + err);
            }
            if (items) {
                items = __.sortBy(items, function(item) {
                    return item.itemInfo.itemIndex;
                });

                // 保存所有节目信息 用以DEBUG
                if (config.crawler.basicInfo.saveLog) {
                    var date = moment().format('YYMMDD');
                    var hour = moment().format('HH');
                    var name = _this.siteName + '_' + _this.dataType;
                    name += '_' + _this.pageType.replace('Page', '');
                    name += '_' + _this.crawlType.replace('crawl', '') + '.log';
                    var path = config.crawler.basicInfo.logPath + date + '/' + hour + '/' + name.toLowerCase();
                    utils.saveFile(path, JSON.stringify(items), 'w');
                }
            }

            callback(items);
        });
    }
};

module.exports = Crawler;
