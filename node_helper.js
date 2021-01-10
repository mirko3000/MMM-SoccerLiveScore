/* global Module */

/* Magic Mirror
 * Module: MMM-SoccerLiveScore
 *
 * By Luke Scheffler https://github.com/LukeSkywalker92
 * MIT Licensed.
 */

var NodeHelper = require('node_helper');
var request = require('request');
const Log = require("../../js/logger.js");

module.exports = NodeHelper.create({
  start: function () {
    Log.log(this.name, 'helper started...')
  },

  stop: function () {
    Log.log(this.name, 'helper started...')
  },

  getLeagueIds: function (leagues, showTables) {
    Log.info(this.name, 'getLeagueIds', 'https://www.ta4-data.de/ta/data/competitions')
    var self = this;
    var options = {
      method: 'POST',
      url: 'https://www.ta4-data.de/ta/data/competitions',
      headers: {
        'Host': 'ta4-data.de',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Connection': 'keep-alive',
        'Accept': '*/*',
        'User-Agent': 'TorAlarm/20161202 CFNetwork/808.1.4 Darwin/16.1.0',
        'Accept-Language': 'de-de',
        'Accept-Encoding': 'gzip',
        'Content-Length': '49',
      },
      body: '{"lng":"de-DE","device_type":0,"decode":"decode"}',
      form: false
    };

    request(options, function (error, response, body) {
      if (!error && body) {
        const parsedBody = JSON.parse(body);
        if('competitions' in parsedBody){
          var competitions = parsedBody.competitions;
          var leagueIds = [];
          for (var i = 0; i < leagues.length; i++) {
            for (var j = 0; j < competitions.length; j++) {
              if (competitions[j].id == leagues[i]) {
                if (showTables && competitions[j].has_table) {
                  self.getTable(competitions[j].id);
                } 
              
                leagueIds.push(competitions[j].id)
                self.sendSocketNotification('LEAGUES', {
                  name: competitions[j].name,
                  id: competitions[j].id
                });
              }
            }
          }
          for (var i = 0; i < leagueIds.length; i++) {
            self.getScores(leagueIds[i]);
          }
        }
      }
    });
  },

  getTeams: function (leagueId) {
    Log.info(this.name, 'getTeams', 'https://www.ta4-data.de/ta/data/competitions/' + leagueId.toString() + '/table')
    var self = this;
    var options = {
      method: 'POST',
      url: 'https://www.ta4-data.de/ta/data/competitions/' + leagueId.toString() + '/table',
      headers: {
        'Host': 'ta4-data.de',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Connection': 'keep-alive',
        'Accept': '*/*',
        'User-Agent': 'TorAlarm/20161202 CFNetwork/808.1.4 Darwin/16.1.0',
        'Accept-Language': 'de-de',
        'Accept-Encoding': 'gzip',
        'Content-Length': '49',
      },
      body: '{"lng":"de-DE","device_type":0,"decode":"decode"}',
      form: false
    };
    request(options, function (error, response, body) {
      var teamIds = [];
      var data = JSON.parse(body);
      for (var i = 0; i < data.data.length; i++) {
        if (data.data[i].type !== 'table') { continue; }
        for (var j = 0; j < data.data[i].table.length; j++) {
          teamIds.push(data.data[i].table[j].team_id);
        }
      }
    });
  },

  getTable: function (leagueId) {
    Log.info(this.name, 'getTable', 'https://www.ta4-data.de/ta/data/competitions/' + leagueId.toString() + '/table')
    var self = this;
    var options = {
      method: 'POST',
      url: 'https://www.ta4-data.de/ta/data/competitions/' + leagueId.toString() + '/table',
      headers: {
        'Host': 'ta4-data.de',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Connection': 'keep-alive',
        'Accept': '*/*',
        'User-Agent': 'TorAlarm/20161202 CFNetwork/808.1.4 Darwin/16.1.0',
        'Accept-Language': 'de-de',
        'Accept-Encoding': 'gzip',
        'Content-Length': '49',
      },
      body: '{"lng":"de-DE","device_type":0,"decode":"decode"}',
      form: false
    };
    request(options, function (error, response, body) {
      if (!error && body) {
        var data = JSON.parse(body);
        data = data.data;
        for (var i = 0; i < data.length; i++) {
          if (data[i].type === 'table') {
            self.sendSocketNotification('TABLE', {
              leagueId: leagueId,
              table: data[i].table
            });
            Log.debug(self.name, 'getTable | data', JSON.stringify(data, null, 2))
            var refreshTime = ((data.refresh_time  || (5 * 60)) * 1000);
            Log.info(self.name, 'getTable | refresh_time', data.refresh_time, refreshTime)
            setTimeout(function () {
              self.getTable(leagueId);
            }, refreshTime);
            return;
          }
        }
      } else {
        setTimeout(function () {
          self.getTable(leagueId);
        }, 60 * 1000);
      }
    });
  },

  getScores: function (leagueId) {
    Log.info(this.name, 'getScores', 'https://www.ta4-data.de/ta/data/competitions/' + leagueId.toString() + '/matches/round/0')
    var self = this;
    var options = {
      method: 'POST',
      url: 'https://www.ta4-data.de/ta/data/competitions/' + leagueId.toString() + '/matches/round/0',
      headers: {
        'Host': 'ta4-data.de',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Connection': 'keep-alive',
        'Accept': '*/*',
        'User-Agent': 'TorAlarm/20161202 CFNetwork/808.1.4 Darwin/16.1.0',
        'Accept-Language': 'de-de',
        'Accept-Encoding': 'gzip',
        'Content-Length': '49',
      },
      body: '{"lng":"de-DE","device_type":0,"decode":"decode"}',
      form: false
    }

    request(options, function (error, response, body) {
      if(!error && body) {
        var data = JSON.parse(body);
        Log.debug(self.name, 'getScores | data', JSON.stringify(data, null, 2))
        var refreshTime = ((data.refresh_time  || (5 * 60)) * 1000);
        Log.info(self.name, 'getScores | refresh_time', data.refresh_time, refreshTime)
        var standings = data.data;
        self.sendSocketNotification('STANDINGS', {
          leagueId: leagueId,
          standings: standings
        });
        setTimeout(function () {
          self.getScores(leagueId);
        }, refreshTime);
      } else {
        setTimeout(function () {
          self.getTable(leagueId);
        }, 60 * 1000);
      }
    });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'CONFIG') {
      this.getLeagueIds(payload.leagues,  payload.showTables);
    }
  }

});
