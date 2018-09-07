/*jslint esversion:6 */

import c from 'validate.io';
import a from 'array-tools';

import Drone from 'hive-drone.js';
import Cralwer from 'hive-crawler.js';

export const MAX_POPULATION = 8;

/**
 * 调度中心负责调度爬虫和工蜂协同工作.
 */
export default class Overlord {

    constructor() {
        this.drone = null;
        this.crawlers = [];
        this.busyCrawlers = [];
        this.taskQueue = [];
    }

    population() {
        return this.crawlers.length + (this.drone ? 1 : 0);
    }

    /**
     * 连接爬虫
     */
    connectCrawler() {
        let a = arguments;
        for (let i = 0; i < a.length; i++) {
            let unit = a[i];
            if (MAX_POPULATION > this.population() && unit instanceof Cralwer) {
                this.crawlers.push(unit);
                unit.on('response', (err, res) => {
                    this._onCrawlerResponse(err, res, unit);
                });

                unit.on('error', (err) => {
                    console.error(err);
                    this._onCrawlerResponse(err, null, unit);
                });
            }
        }
    }

    /**
     * 连接工蜂
     */
    connectDrone(drone) {
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
    submit(task) {
        this.taskQueue.push(task);

        this._assignTaskForCrawler();
    }

    _assignTaskForCrawler() {
        let remains = a(this.crawlers).without(this.busyCrawlers).val();
        while (0 < remains.length && 0 < this.taskQueue.length) {
            let crawler = remains[parseInt(Math.random() * remains.length)];
            let request = this.taskQueue.shift();

            // put crawler into busy list
            this.busyCrawlers.push(crawler);

            // do request
            crawler.request(request);

            // update remains
            remains = a(this.crawlers).without(this.busyCrawlers).val();
        }
    }


    _onCrawlerResponse(err, res, crawler) {
        a.remove(this.busyCrawlers, crawler);

        if (err) {
            console.dir(err);
            return;
        }

        // let the drone find the data.
        if (null != this.drone) {
            let url = res.request.url;
            let payload = res.text;
            this.drone.feed(url, payload);
        }

        // reassign task for crawler
        this._assignTaskForCrawler();
    }

    /**
     * 存数据
     */
    put(id, entry) {
        console.log(`prepare save data[${id}]: ${entry}`);
    }

    /**
     * 取数据
     */
    get(id) {
        console.log(`get data[${id}]`);
    }

}
