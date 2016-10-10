import { Template } from 'meteor/templating';

import './body.html';
import './foursquareClient.js';

mapVars = {
  mymap: null,
  totalDistance: 0,
  totalCheckinCount: 0,
  countriesArr: [],
  countriesTotal: 0,
  markersGroup: null,
  lineGroup: null,
  latlngArr: [],
  previousLocation: null,
  currentLocation: null,
  latestApiVersion: null,
  code: null,
  countryLayer: null,
  countryHoverDefaultStyle: null,
  countryHoverHighlightStyle: null
};

cookies = new Cookies();

Template.body.onCreated(function () {

  //Initialize foundation
  $(document).foundation();

   //Get the potential code from the URL
   mapVars.code = getCode();

   if(mapVars.code != undefined ) {
       Session.set('code', mapVars.code)
   }

   //If the user has previously used the app, use the saved cookie holding the auth token
   if(!cookies.has('authToken') && mapVars.code != undefined) {
       //Get auth token using the code obtained from the URL
       getAuthToken();
   } else if(cookies.has('authToken')) {
       Session.set('authToken', cookies.get('authToken'));
   }

});


Template.body.helpers({

    connectedToFoursquare: function() {
        //Return the boolean state of the connection to the template
        return !Session.equals('authToken', "") && !Session.equals('authToken', undefined);
    }
});


Template.map.onRendered(function(){

    L.Icon.Default.imagePath = Meteor.settings.public.leaflet.defaultMarker;

    //Create new cluster group to hold the markers
    mapVars.markersGroup = new L.markerClusterGroup();
    mapVars.lineGroup = new L.GeoJSON();


    //var currentLocation = getCurrentLocation.init();
    var currentLocation = null;


    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {

            currentLocation = [position.coords.latitude, position.coords.longitude];

            setMap(currentLocation);

        }, function(error) {

            setMap();

        },{timeout:5000});
    }else {

        setMap();
    }


});


Template.body.events({
    'click .foursquare-login': function(){

        if(!cookies.has('authToken')) {
            startAuthenticate();
        }

    },
    'click .display-checkins': function(){

        if(cookies.has('authToken')) {

            //Clear layers and reset variables in case the user clicks the display check-ins button again
            mapVars.markersGroup.clearLayers();

            //Reset the variables in the event of the user clicking the display button again
            initVars();

            //Get todays date for the API call
            mapVars.latestApiVersion = getLatestVersion();

            //GO!
            foursquareApi.init();

        }
    },
    'click .home': function(){
        window.open(Meteor.absoluteUrl(), '_self');
    },
    'change #countries-checkbox': function(event) {
        if(event.currentTarget.checked) {
            mapVars.mymap.addLayer(mapVars.countryLayer);
        } else {
            mapVars.mymap.removeLayer(mapVars.countryLayer);
        }
    },
    'change #checkins-checkbox': function(event) {
        if(event.currentTarget.checked) {
            mapVars.mymap.addLayer(mapVars.markersGroup);
        } else {
            mapVars.mymap.removeLayer(mapVars.markersGroup);
        }
    },
    'change #distance-checkbox': function(event) {
        if(event.currentTarget.checked) {
            mapVars.mymap.addLayer(mapVars.lineGroup);
        } else {
            mapVars.mymap.removeLayer(mapVars.lineGroup);
        }
    }
});

function initVars() {
    mapVars.totalDistance = 0;
    mapVars.totalCheckinCount = 0;
    mapVars.countriesArr = [];
    mapVars.countriesTotal = 0;
    mapVars.latlngArr = [];
    mapVars.previousLocation = null;
    mapVars.currentLocation = null;
}


var getCurrentLocation = {

        init: function() {
            navigator.geolocation.getCurrentPosition(this.success, this.error);
        },
        success: function(position) {
            var latitude  = position.coords.latitude;
            var longitude = position.coords.longitude;

            return [latitude, longitude];

        },
        error: function() {
            return null;
        }


};

function setMap(location) {

    if(location != undefined) {
        mapVars.mymap = L.map('mapid').setView(location, 13);

    } else {
        mapVars.mymap = L.map('mapid').setView([51.505, -0.09], 4);
    }


    L.tileLayer(Meteor.settings.public.leaflet.tileUrl + '?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: Meteor.settings.public.leaflet.mapId,
        accessToken: Meteor.settings.public.leaflet.publicKey,
    }).addTo(mapVars.mymap);

    mapVars.mymap.addLayer(mapVars.markersGroup);
    mapVars.mymap.addLayer(mapVars.lineGroup);


}

function getLatestVersion() {

    //Get todays date to be sent as a URL parameter to the foursquare API
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var day = d.getMonth();

    if(month <10){
        month = "0"+month;
    }
    if(day <10){
        day = "0"+day;
    }
    return year+month+day;
}

function getCode() {

    //Use lookahead to obtain 'code' from the URL
    var re = /code=(.*?)#/;
    var url = window.location.href;
    var m;

    if ((m = re.exec(url)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }

        return m[1];
    }
}



var devCookie = "my websites cookie=123";
if (document.cookie.indexOf(devCookie) === -1)
{
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-74354041-5', 'auto');
    ga('send', 'pageview');
}