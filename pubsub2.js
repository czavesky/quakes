if (Meteor.isClient) {
  Quakes = new Mongo.Collection('quakes');

  Session.setDefault('searching', false);

  Tracker.autorun(function() {
    var searchHandle = Meteor.subscribe('quakesSearch');
    Session.set('searching', !searchHandle.ready());
  });

  Template.body.helpers({
    quakes: function() {
      return Quakes.find();
    },
    searching: function() {
      return Session.get('searching');
    }
  });
  
  Template.quake.helpers({
    
    // Format the time
    time: function() {
      return (new Date(this.time)).toLocaleTimeString();
    },
    
    // Convert the latitude to a % for CSS top (really should be center but not for now)
    top: function() {
      return ((this.latitude * -1) + 90) / 180 * 100;
    },
    // Convert the longitude to a % for CSS left (really should be center but not for now)
    left: function() {
      return (this.longitude + 180) / 360 * 100;
    },
    // Convert the magnitude to an opacity from 0 to 1 for CSS
    opacity: function() {
      return Math.min(this.magnitude / 5, 1)
    }
  })
}

if (Meteor.isServer) {
  
  Meteor.publish('quakesSearch', function() {
    var self = this;
    try {
      
      // Feed is from https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
      var response = HTTP.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
      
      console.log(response);

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
  
}
