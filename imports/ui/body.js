import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';


import './body.html';

var mapVars = {
    mymap: null,
    totalDistance: 0,
    totalCheckinCount: 0,
    countriesArr: [],
    countriesTotal: 0,
    markersGroup: null,
    latlngArr: [],
    previousLocation: null,
    currentLocation: null,
    latestApiVersion: null
};

cookies = new Cookies();

Template.body.onCreated(function () {
  $(document).foundation();

    code = getCode();

    if(code != undefined ) {
        Session.set('code', code)
    }

    if(!cookies.has('authToken')) {
        getAuthToken();
    }
    else {
        Session.set('authToken', cookies.get('authToken'));
    }

});


Template.body.helpers({

    connectedToFoursquare: function() {

        if(!Session.equals('authToken', "") && !Session.equals('authToken', undefined)) {
            return true;
        }

        return false;
    }
});

function getLatestVersion() {

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

Template.map.onRendered(function(){ 

    console.log("Map setup");
  
    L.Icon.Default.imagePath = Meteor.settings.public.leaflet.defaultMarker;

    //mapVars.markersGroup = new L.LayerGroup();
    mapVars.markersGroup = new L.markerClusterGroup();

    mapVars.mymap = L.map('mapid'/*, {
        layers: [mapVars.markersGroup]
    }*/).setView([51.505, -0.09], 13);



    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.satellite',
        accessToken: Meteor.settings.public.leaflet.publicKey,
    }).addTo(mapVars.mymap);


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
            mapVars.totalDistance = 0, mapVars.totalCheckinCount = 0, mapVars.countriesArr = [], mapVars.countriesTotal = 0, mapVars.latlngArr = [], mapVars.previousLocation = null, mapVars.currentLocation = null;

            latestApiVersion = getLatestVersion();
            foursquareApi.init();

        }
    },
    'click .home': function(){
        window.open(Meteor.absoluteUrl(), '_self');

    }
});


function startAuthenticate() {
    window.open("https://foursquare.com/oauth2/authenticate?" +
        "client_id=" + Meteor.settings.public.foursquare.clientId +
        "&response_type=code" +
        "&redirect_uri=" + Meteor.settings.public.foursquare.redirectUrl, '_self');
}

function getAuthToken() {

    if(code != null) {

        Meteor.call('getAuthToken', code, function(err, response) {

            if(err) {
                console.log(err)
            }

                Session.set('authToken', response);
            cookies.set('authToken', response);
        });

    }
}

var foursquareApi;
foursquareApi = {


    getJson: function (url, callback) {
        $.getJSON(url, function (data) {
            callback(data);
        });
    },

    getLatestVersion: function () {
        var d = new Date();
        var year = d.getFullYear();
        var month = d.getMonth();
        var day = d.getMonth();

        if (month < 10) {
            month = "0" + month;
        }
        if (day < 10) {
            day = "0" + day;
        }
        return year + month + day;
    },

    list: function (offsetStart, offsetEnd) {


        var url = "https://api.foursquare.com/v2/users/self/checkins?" + "offset=" + offsetStart + "&limit=" + offsetEnd + "&oauth_token=" + cookies.get('authToken') + "&v=" + latestApiVersion;

        console.log("url", url);

        this.getJson(url, function (data) {

            //console.log("getting data ", data);

            var setOfCheckins = data.response.checkins.items;
            var totalCheckins = data.response.checkins.count;

            $.each(setOfCheckins, function (index, value) {

                //console.log(value);
                //console.log(value.venue.name + ' - (' + value.venue.location.lat + ', ' + value.venue.location.lng + ')');

                //To cover the rare case where foursquare has a malformed checkin with no 'venue' object
                if(value.hasOwnProperty('venue')) {

                    mapVars.currentLocation = [value.venue.location.lat, value.venue.location.lng];
                    mapVars.latlngArr.push(mapVars.currentLocation);

                    var countryCode = value.venue.location.cc.toLowerCase();
                    var countryCodeUrl = "http://www.geonames.org/flags/x/" + countryCode + ".gif";

                    var countryIcon = L.icon({
                        iconUrl: "http://www.geonames.org/flags/x/" + countryCode + ".gif",
                        iconAnchor: [12.5, 41]
                    });


                    var marker = L.marker(mapVars.currentLocation).addTo(mapVars.markersGroup);

                    //var marker = L.marker(mapVars.currentLocation, {icon: countryIcon}).addTo(mapVars.markersGroup);

                    //$(marker._icon).addClass('countryMarker');
                    marker.bindPopup(value.venue.name).openPopup();


                    if (mapVars.previousLocation != null) {
                        var polyline = L.polyline([mapVars.previousLocation, mapVars.currentLocation],
                            {
                                color: 'red',
                                weight: 2,
                                opacity: 0.8,
                                smoothFactor: 1

                            }).addTo(mapVars.markersGroup);

                        $('#distanceTotal').text(calculateDistance(mapVars.previousLocation, mapVars.currentLocation).toLocaleString() + "km");
                    }

                   

                    checkCountry(value.venue.location.country)
                    /*if(checkCountry(value.venue.location.country)) {
                     var marker = L.marker(mapVars.currentLocation, {icon: countryIcon}).addTo(mapVars.markersGroup);


                     $(marker._icon).addClass('countryMarker');
                     marker.bindPopup(value.venue.name).openPopup();
                     }*/

                    


                    mapVars.previousLocation = mapVars.currentLocation;
                }
				
				mapVars.totalCheckinCount += 1;
				$('#checkinTotal').text(mapVars.totalCheckinCount);
				$('#countryTotal').text(mapVars.countriesTotal);

            });

            console.log(mapVars.countriesArr);



            if(mapVars.totalCheckinCount < totalCheckins) {
                foursquareApi.list((offsetStart + 250), 250);
            } else {

                mapVars.mymap.addLayer(mapVars.markersGroup);

                var bounds = new L.LatLngBounds(mapVars.latlngArr);
                mapVars.mymap.fitBounds(bounds);

                $('#overlay').remove();
            }

        });

    },


    init: function () {

        loading();

        setTimeout(this.list(0, 250), 1);

    }

};





function loading() {

    var over = '<div id="overlay"><div class="cssload-thecube">' +
                '<div class="cssload-cube cssload-c1"></div>' +
                '<div class="cssload-cube cssload-c2"></div>' + 
                '<div class="cssload-cube cssload-c4"></div>' + 
                '<div class="cssload-cube cssload-c3"></div>' +
            '</div></div>'
        $(over).appendTo('body');
}

function calculateDistance(pointA, pointB) {
    
    var p = 0.017453292519943295; 

    var c = Math.cos;
    var a = 0.5 - c((pointB[0] - pointA[0]) * p)/2 + c(pointA[0] * p) * c(pointB[0] * p) *  (1 - c((pointB[1] - pointA[1]) * p))/2;

    var distance = 12742 * Math.asin(Math.sqrt(a));
    
    mapVars.totalDistance += parseInt(distance);

    return mapVars.totalDistance;
}

function checkCountry(country) {
    
    if(mapVars.countriesArr.indexOf(country) == -1 && country != undefined) {
        mapVars.countriesArr.push(country);
        mapVars.countriesTotal += 1;

        return true;
    }
    
    return false;
}

function getCode() {
    var re = /code=(.*?)#/; 
    var url = window.location.href;
    var m;
     
    if ((m = re.exec(url)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }
        
        console.log(m[1]);
        
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

