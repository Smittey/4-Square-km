import './body.html';
import './body.js';

var foursquareClientVars = {
    foursquareApi : null
};


startAuthenticate = function() {
    window.open("https://foursquare.com/oauth2/authenticate?" +
        "client_id=" + Meteor.settings.public.foursquare.clientId +
        "&response_type=code" +
        "&redirect_uri=" + Meteor.settings.public.foursquare.redirectUrl, '_self');
};

getAuthToken = function() {

    Meteor.call('getAuthToken', mapVars.code, function(err, response) {

        if(err) {
            console.log(err)
        }

        Session.set('authToken', response);
        cookies.set('authToken', response);
    });

};

foursquareApi = {

    getJson: function (url, callback) {
        $.getJSON(url, function (data) {
            callback(data);
        });
    },
    list: function (offsetStart, offsetEnd) {

        var baseUrl = "https://api.foursquare.com/v2/users/self/checkins?" + "offset=" + offsetStart + "&limit=" + offsetEnd + "&oauth_token=" + cookies.get('authToken') + "&v=" + mapVars.latestApiVersion;

        if($('input[name="checkin-radio"]:checked').attr('id') == 'radio-range') {

            var fromDate = new Date($('#datepicker').val()).valueOf()/1000;
            var toDate = new Date($('#datepicker1').val()).valueOf()/1000;

            var rangeString = "&afterTimestamp=" + fromDate + "&beforeTimestamp=" + toDate;

            baseUrl += rangeString;
        }


        this.getJson(baseUrl, function (data) {

            var setOfCheckins = data.response.checkins.items;
            var totalCheckins = data.response.checkins.count;

            $.each(setOfCheckins, function (index, value) {

                //To cover the rare case where foursquare has a malformed checkin with no 'venue' object
                if(value.hasOwnProperty('venue')) {

                    mapVars.currentLocation = [value.venue.location.lat, value.venue.location.lng];
                    mapVars.latlngArr.push(mapVars.currentLocation);


                    var marker;

                    if(mapVars.totalCheckinCount == 0) {
                        marker = L.icon({
                            iconUrl: "http://besticons.net/sites/default/files/checker-flag-icon-5790.png",
                            iconSize: [32, 32],
                            iconAnchor:   [0, 32],
                            popupAnchor:  [16, -32]
                        });
                        marker = L.marker(mapVars.currentLocation, {icon: marker}).addTo(mapVars.terminusMarkersGroup);

                    } else if(mapVars.totalCheckinCount == (totalCheckins - 1)) {
                        marker = L.icon({
                            iconUrl: "http://besticons.net/sites/default/files/green-flag-icon-680.png",
                            iconSize: [50, 32],
                            iconAnchor:   [25, 32],
                            popupAnchor:  [12.5, -32]
                        });
                        marker = L.marker(mapVars.currentLocation, {icon: marker}).addTo(mapVars.terminusMarkersGroup);

                    } else {
                        marker = L.marker(mapVars.currentLocation).addTo(mapVars.markersGroup);
                    }


                    var date = new Date(parseInt(value.createdAt)*1000);

                    var formattedDate = (date.getMonth() + 1) + "/" +
                        date.getDate() + "/" +
                        date.getFullYear() + " " +
                        date.getHours() + ":" +
                        date.getMinutes() + ":" +
                        date.getSeconds();

                    // specify popup options
                    var customOptions = {
                        'maxWidth': '500',
                        'className' : 'custom'
                    };

                    var popupString= "<b>" + formattedDate + "</b>" + "<br><br>" + value.venue.name + "<br><br>";

                    if(value.photos.count != 0) {
                        popupString += "<img src='" + getImageFromCheckin(value.photos) + "' alt='Check-in picture' width='350px'/>";
                    }

                    marker.bindPopup(popupString, customOptions).openPopup();


                    if (mapVars.previousLocation != null) {

                        var polyline = L.polyline([mapVars.previousLocation, mapVars.currentLocation],
                            {
                                color: 'red',
                                weight: 2,
                                opacity: 0.8,
                                smoothFactor: 1

                            })
                            .on('mouseover', function() {
                                this.setStyle({
                                    color: 'blue',
                                    weight: 5
                                });
                            })
                            .on('mouseout', function (e) {
                                e.target.setStyle({
                                    color: 'red',
                                    weight: 1
                                });
                            })
                            .addTo(mapVars.lineGroup);

                        $('#distanceTotal').text(calculateDistance(mapVars.previousLocation, mapVars.currentLocation).toLocaleString() + "km");


                    }




                    checkCountry(value.venue.location.country);

                    mapVars.previousLocation = mapVars.currentLocation;
                }

                mapVars.totalCheckinCount += 1;
                $('#checkinTotal').text(mapVars.totalCheckinCount);
                $('#countryTotal').text(mapVars.countriesTotal);

            });



            if(setOfCheckins.length != 0) {
                foursquareApi.list((offsetStart + 250), 250);
            } else {



                mapVars.mymap.addLayer(mapVars.markersGroup);

                var bounds = new L.LatLngBounds(mapVars.latlngArr);

                if(mapVars.totalCheckinCount != 0) {

                    mapVars.mymap.fitBounds(bounds);
                    setCountryBoundaries();

                }

                $('#overlay').remove();
            }

        });
    },
    init: function () {

        loading();

        setTimeout(this.list(0, 250), 1);
    }
};


function getImageFromCheckin(photoObject) {

    return photoObject.items[0].prefix + "original" + photoObject.items[0].suffix;
}

function loading() {

    var over = '<div id="overlay"><div class="cssload-thecube">' +
        '<div class="cssload-cube cssload-c1"></div>' +
        '<div class="cssload-cube cssload-c2"></div>' +
        '<div class="cssload-cube cssload-c4"></div>' +
        '<div class="cssload-cube cssload-c3"></div>' +
        '</div></div>';

    $(over).appendTo('body');
}

function setCountryBoundaries() {

    mapVars.countryHoverDefaultStyle = {
        color: "#07E00E",
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.2,
        fillColor: "#07E00E"
    };
    mapVars.countryHoverHighlightStyle = {
        color: '#07E00E',
        weight: 3,
        opacity: 0.6,
        fillOpacity: 0.65,
        fillColor: '#07E00E'
    };
    mapVars.countryDefault = {
        color: '#07E00E',
        weight: 3,
        opacity: 0,
        fillOpacity: 0,
        fillColor: '#07E00E'
    };


    var onEachCountry = function(feature, layer) {

        if(mapVars.countriesArr.some(function(v) { return feature.properties.name.indexOf(v) >= 0; })) {
        //if(mapVars.countriesArr.indexOf(feature.properties.name) != -1) {
        //if(feature.properties.name.includes(mapVars.countriesArr[length]) !=-1 ) {
            layer.setStyle(mapVars.countryHoverDefaultStyle);

            (function (layer, properties) {

                layer.on("mouseover", function (e) {
                    layer.setStyle(mapVars.countryHoverHighlightStyle);
                });

                layer.on("mouseout", function (e) {
                    layer.setStyle(mapVars.countryHoverDefaultStyle);
                });

                layer.on("click", function (e) {
                    mapVars.mymap.fitBounds(layer.getBounds());
                });

            })(layer, feature.properties);
        } else {
            layer.setStyle(mapVars.countryDefault);
        }
    };

    mapVars.countryLayer = L.geoJson(boundaries, {
        onEachFeature: onEachCountry
    });

    mapVars.mymap.addLayer(mapVars.countryLayer);
    mapVars.countryLayer.bringToBack();
}

function getLatestVersion() {
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