$(document).foundation()


var mymap;
var totalDistance = 0;
var totalCheckinCount = 0;
var countriesArr = [];
var countriesTotal = 0;
var markersGroup;
var latlngArr = [];
var previousLocation = null;
var currentLocation = null;
            
$(document).ready(function() {
        
    markersGroup = new L.LayerGroup();

    mymap = L.map('mapid', {
        layers: [markersGroup]
    }).setView([51.505, -0.09], 13);
    

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.satellite',
        accessToken: 'pk.eyJ1Ijoic21pdHRleSIsImEiOiJjaW80dGlsc3IwMDNvdXNrbmRtM3Zmd3J6In0.z0r08XD3wXm6AjIdNbwlKg'
    }).addTo(mymap);

    foursquareApi.init();


});


var foursquareApi = {
    clientId: "DEIVBOHXOPG2VSJ120LGGGMOC4QI033CJ31Z5ZVCZXFI4D3Z",
    clientSecret: "",
    oauth_token:"",
    code: "",
    redirectUrl : "http://localhost/DistanceCalculator/",
    authorize: function(){
        var url = "https://foursquare.com/oauth2/access_token";
            url += "?client_id="+this.clientId;
            url += "&client_secret="+this.clientSecret;
            url += "&grant_type=authorization_code";
            url += "&redirect_uri="+this.redirectUrl;
            url += "&code="+this.code;

            this.getJson(url, function(data){
                console.log("authorize",data);
            })
    },
    
    getJson: function(url, callback){
        $.getJSON(url, function(data) {
          callback(data);
        });
    },


    getLatestVersion: function(){
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
    },
    
    list: function(offsetStart, offsetEnd){

        
        var latestversion = this.getLatestVersion();
        
        var url = "https://api.foursquare.com/v2/users/self/checkins?" + "offset=" + offsetStart + "&limit=" + offsetEnd + "&oauth_token=" + this.oauth_token + "&v="+latestversion;
        
        console.log("url", url);
        
        this.getJson(url, function(data){
        
            //console.log("getting data ", data);
            
            var setOfCheckins = data.response.checkins.items;
            var totalCheckins = data.response.checkins.count;
          
            $.each(setOfCheckins, function(index, value) {
                
                //console.log(value);
                //console.log(value.venue.name + ' - (' + value.venue.location.lat + ', ' + value.venue.location.lng + ')');
                
                currentLocation = [value.venue.location.lat, value.venue.location.lng];
                latlngArr.push(currentLocation);
                      

                var marker = L.marker(currentLocation).addTo(markersGroup);
                marker.bindPopup(value.venue.name).openPopup();
                
                                     
                if(previousLocation != null) {
                    var polyline = L.polyline([previousLocation, currentLocation], {color: 'red'}).addTo(markersGroup);
                    
                    $('#distanceTotal').text( calculateDistance(previousLocation, currentLocation).toLocaleString() + "km");  
                }
                
                totalCheckinCount += 1;     
                $('#checkinTotal').text( totalCheckinCount );  
                
                
                $('#countryTotal').text(checkCountry(value.venue.location.country));
                
                previousLocation = currentLocation;
              
            });
            
            console.log(countriesArr);

            var bounds = new L.LatLngBounds(latlngArr);
            mymap.fitBounds(bounds);
            
            if(totalCheckinCount < totalCheckins) { 
                foursquareApi.list((offsetStart + 250), 250);            
            } else {
                $('#overlay').remove();
            }
        });
    },
    

    init: function(){
        
        loading();
        
        
        setTimeout(this.list(0, 250), 1);
        
        /*setTimeout(function () {
			foursquareApi.list(0, 250);        
		}, 1);*/
        
        
        
        
    },

};

function loading() {
    var over = '<div id="overlay">' +
            
            '</div>';
        $(over).appendTo('body');
}

function calculateDistance(pointA, pointB) {
    
    var p = 0.017453292519943295; 

    var c = Math.cos;
    var a = 0.5 - c((pointB[0] - pointA[0]) * p)/2 + c(pointA[0] * p) * c(pointB[0] * p) *  (1 - c((pointB[1] - pointA[1]) * p))/2;

    var distance = 12742 * Math.asin(Math.sqrt(a));
    
    totalDistance += parseInt(distance);

    return totalDistance;
}

function checkCountry(country) {
    
    if(countriesArr.indexOf(country) == -1 && country != undefined) {
        countriesArr.push(country);
        countriesTotal += 1;
    }
    
    return countriesTotal;        
}