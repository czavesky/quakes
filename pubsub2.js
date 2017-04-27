// import { Mongo } from 'meteor/mongo';
const Visitors = new Mongo.Collection('visitors');

if (Meteor.isClient) {
  const Quakes = new Mongo.Collection('quakes');

  Session.setDefault('searching', false);

  Tracker.autorun(function() {
    var searchHandle = Meteor.subscribe('quakesSearch');
    Session.set('searching', !searchHandle.ready());
  });

  var user_location = function() {
    var location = geoip.get('location');
    if (location) {
      return location;
    }
    else {
      return {latitude: 0, longitude: 0};
    }
  }

  Template.body.helpers({
    quakes: function() {
      return Quakes.find();
    },
    searching: function() {
      return Session.get('searching');
    },
    location: function() {
      console.log('location', user_location());
      return user_location().latitude + ', ' + user_location().longitude;
    }
  });

  var latitude_percent = function(latitude) {
    return ((latitude * -1) + 90) / 180 * 100;
  };
  var longitude_percent = function(longitude) {
    return (longitude + 180) / 360 * 100;
  };

  Template.visitors.onCreated(function () {
    Meteor.subscribe('visitors');

    // Get visitors saved in the db
    const savedVisitors = Visitors.find().collection._docs._map;
    console.log(savedVisitors)
    // Fetch users location
    $.getJSON("http://freegeoip.net/json/", function(location) {
      const locationInfor = {
        country_code: location.country_code,
        country: location.country_name,
        city: location.city,
        ip: location.ip,
        time_zone: location.time_zone,
        latitude: location.latitude,
        longitude: location.longitude,
        createdAt: new Date()
      }
      setTimeout(() => {
        const visitorsOn = Object.keys(savedVisitors);
        console.log(visitorsOn)
        visitorsOn.forEach((visitor) => {
          const pageWidth = $("body").width();
          const randomXPoint = Math.round(Math.random()*pageWidth);
          var randomYPoint = $("body").height() - Math.round(Math.random() * 200) + 20;
          $("body").append('<div id='+ visitor +' style="border: 1px solid red; border-bottom: 10px solid red; border-radius: 5px; background: white; height: 20px; width: 5px; position:fixed; top: '+randomYPoint+'px; left: '+randomXPoint+'px"></div>')
          setInterval(() => {
            randomYPoint -= 10;
            // $(`#${visitor}`).css('top', randomYPoint);
            $(`#${visitor}`).animate({'top':randomYPoint, 'height':$(`#${visitor}`).height() + 10}, 1000);
            // $(`#${visitor}`).css('height', $(`#${visitor}`).height() + 10);
          }, 1000)
        })
      }, 3000);

      // Insert a visitor into the collection
      // Meteor.call('visitors.insert', locationInfor);
      Meteor.call('visitors.upsert', locationInfor);
      // Meteor.call('visitors.remove');
    });
  });

  Template.quake.helpers({

    // Format the time
    time: function() {
      return (new Date(this.time)).toLocaleTimeString();
    },
    // Top of the line, as a % 0-100
    top: function() {
      var earthquake_y = latitude_percent(this.latitude);
      var user_y = latitude_percent(user_location().latitude);
      return Math.min(earthquake_y, user_y);
    },
    // Left of the line, as a % 0-100
    left: function() {
      var earthquake_x = longitude_percent(this.longitude);
      var user_x = longitude_percent(user_location().longitude);
      return Math.min(earthquake_x, user_x);
    },
    // Height of the line, as a % 0-100
    height: function() {
      var earthquake_y = latitude_percent(this.latitude);
      var user_y = latitude_percent(user_location().latitude);
      return Math.abs(user_y - earthquake_y);
    },
    // Width of the line, as a % 0-100
    width: function() {
      var earthquake_x = longitude_percent(this.longitude);
      var user_x = longitude_percent(user_location().longitude);
      return Math.abs(user_x - earthquake_x);
    },
    // Convert the magnitude to an opacity from 0 to 1 for CSS
    opacity: function() {
      return Math.min(this.magnitude / 5, 1);
    },
    tooltip: function() {
      console.log('Safari');
    },
  })
}

if (Meteor.isServer) {
  Meteor.publish('quakesSearch', function() {
    var self = this;
    try {

      // Feed is from https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
      var response = HTTP.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');

      // console.log(response);

      _.each(response.data.features, function(feature) {
        if (feature.properties && feature.geometry && feature.geometry.coordinates) {
          var doc = {
            place: feature.properties.place,
            time: feature.properties.time,
            magnitude: feature.properties.mag,
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
            depth: feature.geometry.coordinates[1],
            usgs_id: feature.id
          };

          self.added('quakes', Random.id(), doc);
        }
      });

      self.ready();

    } catch(error) {
      console.log(error);
    }
  });

  Meteor.publish('visitors', function visitorsPublication() {
    return Visitors.find();
  });

  Meteor.methods({
    'visitors.insert' (locationInfor) {
      Visitors.insert(locationInfor);
    },

    'visitors.upsert' (locationInfor) {
      Visitors.upsert({
        ip: locationInfor.ip
      }, {
        $set: locationInfor
      });
    },

    'visitors.remove' () {
      Visitors.remove({});
    }
  })

}
