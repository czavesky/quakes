## Start application

    HTTP_FORWARDED_COUNT=1 meteor --port $IP:$PORT
    
(The HTTP_FORWARDED_COUNT value might have to be adjusted, or eliminated, in
server contexts other than Cloud9.)

## TODO

* Render the earthquakes correctly as gradients emanating out from the user's
  location
* Get presence of all connected users. We need to know when they connected, 
  when they disconnected, their IP address, and their latitude and longitude.
* Render connected users graphically. Each user should be rendered at their
  latitude and longer. The longer they stay connected, the top of the  line 
  extends up. The longer they are disconnected, the bottom of the line moves up.
* Just show the most recent earthquake.
* Refresh the earthquake data periodically. Can we use the USGS id's to avoid 
  redrawing quakes we've already drawn?
* Always center the globe on the user
* Mouse event for transparency.
