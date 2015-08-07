var exports = {
    casper : {
        verbose : false,
        logLevel : 'debug',
        exitOnError : false,
        webSecurityEnabled : false,
        clientScripts : ['./lib/includes/jquery.js', './lib/includes/underscore.js'],
        pageSettings : {
            loadImages : false,
            loadPlugins : false,
            javascriptEnabled : true,
            webSecurityEnabled : false,
            userAgent : 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36',
            viewportSize : {
                width : 1920,
                height : 1080
            }
        }
    },
    crawler : {
        basicInfo : {
            debug : true,
            saveLog : true,
            logPath : './logs/',
            mailInfo : {
                mailHost : 'smtp.qq.com',
                mailUserName : 'targetv@qq.com',
                mailPassword : 'targetv2012',
                mailTo : ['znyang@targetv.com']
            },
            crawlInfo : {
                sohu : ['movie', 'tv']
            },
            pageTypes : ['hotPage', 'newPage']
        },
        siteInfo : {
            sohu : {
                movie : {
                    enabled : true,
                    threadLimit : 5,
                    maxPageLimit : 1000,

                    newPage : 'http://so.tv.sohu.com/list_p1100_p2_p3_p4_p5_p6_p73_p8_p91_p10pagenum_p11_p12_p13.html',
                    hotPage : 'http://so.tv.sohu.com/list_p1100_p2_p3_p4_p5_p6_p77_p8_p91_p10pagenum_p11_p12_p13.html',
                    referUrl : 'http://tv.sohu.com/',

                    videoList : 'ul.st-list',
                    videoItem : 'ul.st-list li',
                    videoExclude : 'span.rl-rep',

                    pageCount : 'div.ssPages em + a',
                    videoName : 'div.st-pic + strong > a',
                    imageUrl : 'div.st-pic > a > img',
                    indexPage : 'div.st-pic + strong > a',

                    basicInfo : {
                        director : '',
                        actor : 'p.actor > a',
                        region : 'p.lh-area > a:eq(1)',
                        category : 'p.lh-type > a',
                        publishTime : 'p.lh-area > a:eq(0)',
                        description : 'p.lh-info'
                    },
                    detailInfo : {
                        imageUrl : 'div.movie-pic > a > img',
                        director : 'div.movie-infoR > ul.cfix > li:eq(4)',
                        actor : 'div.movie-infoR > ul.cfix > li:eq(5)',
                        region : 'div.movie-infoR > ul.cfix > li:eq(2)',
                        category : 'div.movie-infoR > ul.cfix > li:eq(3)',
                        publishTime : 'div.movie-infoR > ul.cfix > li:eq(1)',
                        description : 'span.full_intro:eq(0)',

                        episodeCount : '',
                        episodeData : '',
                        episodeItem : 'div.movie-infoR a.btn-playFea'
                    }
                },
                tv : {
                    enabled : true,
                    threadLimit : 5,
                    maxPageLimit : 1000,

                    newPage : 'http://so.tv.sohu.com/list_p1101_p2_p3_p4_p5_p6_p73_p8_p91_p10pagenum_p11_p12_p13.html',
                    hotPage : 'http://so.tv.sohu.com/list_p1101_p2_p3_p4_p5_p6_p7_p8_p91_p10pagenum_p11_p12_p13.html',
                    referUrl : 'http://tv.sohu.com/',

                    videoList : 'ul.st-list',
                    videoItem : 'ul.st-list li',
                    videoExclude : 'span.rl-rep',

                    pageCount : 'div.ssPages em + a',
                    videoName : 'div.st-pic + strong > a',
                    imageUrl : 'div.st-pic > a > img',
                    indexPage : 'div.st-pic + strong > a',

                    basicInfo : {
                        director : '',
                        actor : 'p.actor > a',
                        region : 'p.lh-area > a:eq(1)',
                        category : 'p.lh-type > a',
                        publishTime : 'p.lh-area > a:eq(0)',
                        description : 'p.lh-info'
                    },
                    detailInfo : {
                        imageUrl : 'div.drama-pic > a > img',
                        director : 'div.drama-infoR > ul.cfix > li:eq(4)',
                        actor : 'div.drama-infoR > ul.cfix > li:eq(5)',
                        region : 'div.drama-infoR > ul.cfix > li:eq(2)',
                        category : 'div.drama-infoR > ul.cfix > li:eq(3)',
                        publishTime : 'div.drama-infoR > ul.cfix > li:eq(1)',
                        description : 'span.full_intro:eq(0)',

                        episodeCount : 'div.drama-name > h2 + span',
                        episodeData : 'div.mod.general ul.list.listA.cfix',
                        episodeItem : 'div.mod.general ul.list.listA.cfix li'
                    }
                }
            }
        }
    }
};

module.exports = exports;
