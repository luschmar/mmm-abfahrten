var NodeHelper = require('node_helper');

const https = require("https");

module.exports = NodeHelper.create({

    scheduleUpdate: function () {
        var self = this;
        this.updateAbfahrten(this.config);
        setInterval(this.updateAbfahrten.bind(this), this.config.updateInterval);
    },

    updateAbfahrten: function () {
        var self = this;

        var now = new Date();
        now = now.setMinutes(now.getMinutes() + this.config.minuteOffset);
        var hours = ('0' + new Date(now).getHours()).slice(-2);
        var mins = ('0' + new Date(now).getMinutes()).slice(-2);

        for (var i = 0; i < this.config.stops.length; i++) {
            const thisStop = this.config.stops[i];
            var url = this.config.apiBase + '?stop=' + thisStop + '&limit=' + this.config.fetchCount + '&time=' + hours + ':' + mins;
            https.get(url, (res) => {
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    var result = JSON.parse(rawData);
                    var data = result.connections.map((item) => {
                        return {
                            line: item.line,
                            destination: self.transformDestination(item.terminal.name),
                            color: '#' + item.color.split("~")[0],
                            fontColor: '#' + item.color.split("~")[1],
                            time: (Math.abs((Date.parse(item.time) - Date.now()) / (1000 * 60)).toFixed(0))
                        };
                    });

                    self.sendSocketNotification('ABFAHRTEN_DATA', { stop: thisStop, connections: data });
                });
            }).on('error', (e) => {
                console.error(e);
            });
        }
    },

    transformDestination: function (destination) {
        var dest = destination;
        for (var i = 0; i < this.config.replaceDestinationString.length; i++) {
            dest = dest.replace(this.config.replaceDestinationString[i][0], this.config.replaceDestinationString[i][1]);
        }
        return dest;
    },

    // NOTIFICATIONS
    socketNotificationReceived: function (notification, payload) {
        var self = this;
        if (notification === 'CONFIG') {
            if (this.started !== true) {
                this.started = true;
                this.config = payload;
                this.scheduleUpdate();
            }
        }
    },
});