
Module.register("mmm-abfahrten", {
    // Define module defaults
    defaults: {
        updateInterval: 5 * 60 * 1000, // Update every 5 minutes.
        fetchCount: 12, // Number of connections to fetch per stop.
        apiBase: 'https://search.ch/timetable/api/stationboard.json',
        stops: ['Kunsthaus', 'Neumarkt'],
        minuteOffset: 3,
        replaceDestinationString: [
            ['Zürich, ', ''],
            ['Zürich ', ''],
            [', Bahnhof', '']
        ]
    },

    requiresVersion: "2.1.0", // Required version of MagicMirror

    start: function () {
        var self = this;
        Log.info("Starting module: " + this.name);
        this.abfahrten = {};
        this.sendSocketNotification('CONFIG', this.config);

        setInterval(function () {
            Object.keys(self.abfahrten).forEach((key) => {
                var connections = self.abfahrten[key];
                for (var i = 0; i < connections.length; i++) {
                    connections[i].time -= 1;
                }
                self.abfahrten[key] = connections.filter(item => item.time > self.config.minuteOffset);
            });
            self.updateDom();
        }, 1000 * 60);
    },

    getTemplate: function () {
        return "mmm-abfahrten.njk";
    },

    getStyles: function () {
        return [
            this.file('mmm-abfahrten.css')
        ];
    },

    getTemplateData: function () {
        const clone = JSON.parse(JSON.stringify(this.abfahrten));
        Object.keys(clone).forEach((key) => {
            clone[key] = clone[key].splice(0, 6);
        });

        return { data: clone };
    },

    socketNotificationReceived: function (notification, payload) {
        var self = this;
        if (notification === 'ABFAHRTEN_DATA') {
            this.abfahrten[payload.stop] = payload.connections;
            this.updateDom();
        }
    },
});