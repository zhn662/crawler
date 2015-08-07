var exports = {
    getDetailDirector : function(detailInfo) {
        var director = null;

        var element;
        if ($(detailInfo.director).text().indexOf('导演：') > -1) {
            element = $(detailInfo.director);
        } else {
            var siblings = $(detailInfo.director).siblings();
            siblings.each(function() {
                if ($(this).text().indexOf('导演：') > -1) {
                    element = $(this);
                }
            });
        }
        if (element) {
            director = element.children('a').map(function(index, item) {
                return $(this).text().trim();
            });
            director = [].slice.call(director, 0);
        }

        return director;
    },
    getDetailActor : function(detailInfo) {
        var actor = null;

        var element;
        if ($(detailInfo.actor).text().indexOf('主演：') > -1) {
            element = $(detailInfo.actor);
        } else {
            var siblings = $(detailInfo.actor).siblings();
            siblings.each(function() {
                if ($(this).text().indexOf('主演：') > -1) {
                    element = $(this);
                }
            });
        }
        if (element) {
            actor = element.children('a').map(function(index, item) {
                return $(this).text().trim();
            });
            actor = [].slice.call(actor, 0);
        }

        return actor;
    },
    getDetailRegion : function(detailInfo) {
        var region = null;

        var element;
        if ($(detailInfo.region).text().indexOf('地区：') > -1) {
            element = $(detailInfo.region);
        } else {
            var siblings = $(detailInfo.region).siblings();
            siblings.each(function() {
                if ($(this).text().indexOf('地区：') > -1) {
                    element = $(this);
                }
            });
        }
        if (element) {
            region = element.children('a').map(function(index, item) {
                return $(this).text().trim();
            });
            region = [].slice.call(region, 0);
        }

        return region;
    },
    getDetailCategory : function(detailInfo) {
        var category = null;

        var element;
        if ($(detailInfo.category).text().indexOf('类型：') > -1) {
            element = $(detailInfo.category);
        } else {
            var siblings = $(detailInfo.category).siblings();
            siblings.each(function() {
                if ($(this).text().indexOf('类型：') > -1) {
                    element = $(this);
                }
            });
        }
        if (element) {
            category = element.children('a').map(function(index, item) {
                return $(this).text().trim();
            });
            category = [].slice.call(category, 0);
        }

        return category;
    },
    getDetailPublishTime : function(detailInfo) {
        var publishTime = null;

        var element;
        if ($(detailInfo.publishTime).text().indexOf('上映时间：') > -1) {
            element = $(detailInfo.publishTime);
        } else {
            var siblings = $(detailInfo.publishTime).siblings();
            siblings.each(function() {
                if ($(this).text().indexOf('上映时间：') > -1) {
                    element = $(this);
                }
            });
        }
        if (element) {
            publishTime = element.text();
            publishTime = publishTime.replace(/.*(\d{4}(?:[-\d]{2,}){0,2}).*/, '$1');
        }

        return publishTime;
    },
    getDetailEpisodeCount : function(detailInfo) {
        var episodeCount = 0;

        var text = $(detailInfo.episodeCount).text();
        if (text) {
            if (text.search(/(\d+)集全/) > -1) {
                episodeCount = text.replace(/.*?(\d+)集全.*/, '$1');
            } else if (text.search(/\/(\d+)集/) > -1) {
                episodeCount = text.replace(/.*?\/(\d+)集.*/, '$1');
            }
            try {
                episodeCount = parseInt(episodeCount);
            } catch (e) {
                episodeCount = 0;
            }
        }

        return episodeCount;
    },
    getDetailEpisodeItem : function(detailInfo) {
        var episodeItem = null;

        episodeItem = $(detailInfo.episodeItem).map(function(index, item) {
            var episodeNum = $(this).find('strong a').text().replace(/.*第(\d+)集.*/, '$1');
            var episodePage = $(this).find('strong a').attr('href');

            if (episodeNum.search(/^\d+$/) !== -1) {
                return {
                    episodeNum : parseInt(episodeNum),
                    episodePage : episodePage
                };
            }
        });
        if (episodeItem) {
            episodeItem = [].slice.call(episodeItem, 0);
        }

        return episodeItem;
    }
};

module.exports = exports;
