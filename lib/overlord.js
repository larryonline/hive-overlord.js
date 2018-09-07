'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MAX_POPULATION = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*jslint esversion:6 */

var _validate = require('validate.io');

var _validate2 = _interopRequireDefault(_validate);

var _arrayTools = require('array-tools');

var _arrayTools2 = _interopRequireDefault(_arrayTools);

var _hiveDrone = require('hive-drone.js');

var _hiveDrone2 = _interopRequireDefault(_hiveDrone);

var _hiveCrawler = require('hive-crawler.js');

var _hiveCrawler2 = _interopRequireDefault(_hiveCrawler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MAX_POPULATION = exports.MAX_POPULATION = 8;

/**
 * 调度中心负责调度爬虫和工蜂协同工作.
 */

var Overlord = function () {
    function Overlord() {
        _classCallCheck(this, Overlord);

        this.drone = null;
        this.crawlers = [];
        this.busyCrawlers = [];
        this.taskQueue = [];
    }

    _createClass(Overlord, [{
        key: 'population',
        value: function population() {
            return this.crawlers.length + (this.drone ? 1 : 0);
        }

        /**
         * 连接爬虫
         */

    }, {
        key: 'connectCrawler',
        value: function connectCrawler() {
            var _this = this;

            var a = arguments;

            var _loop = function _loop(i) {
                var unit = a[i];
                if (MAX_POPULATION > _this.population() && unit instanceof _hiveCrawler2.default) {
                    _this.crawlers.push(unit);
                    unit.on('response', function (err, res) {
                        _this._onCrawlerResponse(err, res, unit);
                    });

                    unit.on('error', function (err) {
                        console.error(err);
                        _this._onCrawlerResponse(err, null, unit);
                    });
                }
            };

            for (var i = 0; i < a.length; i++) {
                _loop(i);
            }
        }

        /**
         * 连接工蜂
         */

    }, {
        key: 'connectDrone',
        value: function connectDrone(drone) {
            if (this.drone) {
                this.drone.overlord = null;
            }

            this.drone = drone;

            if (this.drone) {
                this.drone.overlord = this;
            }
        }

        /**
         * 提交任务到 overlord
         */

    }, {
        key: 'submit',
        value: function submit(task) {
            this.taskQueue.push(task);

            this._assignTaskForCrawler();
        }
    }, {
        key: '_assignTaskForCrawler',
        value: function _assignTaskForCrawler() {
            var remains = (0, _arrayTools2.default)(this.crawlers).without(this.busyCrawlers).val();
            while (0 < remains.length && 0 < this.taskQueue.length) {
                var crawler = remains[parseInt(Math.random() * remains.length)];
                var request = this.taskQueue.shift();

                // put crawler into busy list
                this.busyCrawlers.push(crawler);

                // do request
                crawler.request(request);

                // update remains
                remains = (0, _arrayTools2.default)(this.crawlers).without(this.busyCrawlers).val();
            }
        }
    }, {
        key: '_onCrawlerResponse',
        value: function _onCrawlerResponse(err, res, crawler) {
            _arrayTools2.default.remove(this.busyCrawlers, crawler);

            if (err) {
                console.dir(err);
                return;
            }

            // let the drone find the data.
            if (null != this.drone) {
                var url = res.request.url;
                var payload = res.text;
                this.drone.feed(url, payload);
            }

            // reassign task for crawler
            this._assignTaskForCrawler();
        }

        /**
         * 存数据
         */

    }, {
        key: 'put',
        value: function put(id, entry) {
            console.log('prepare save data[' + id + ']: ' + entry);
        }

        /**
         * 取数据
         */

    }, {
        key: 'get',
        value: function get(id) {
            console.log('get data[' + id + ']');
        }
    }]);

    return Overlord;
}();

exports.default = Overlord;