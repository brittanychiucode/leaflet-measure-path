/*
	Leaflet Measure Path, a plugin that adds measurements to the lines of polygons and circles and a label to the polygon or circle if updateLabel is called.
	(c) 2016-2020, ProminentEdge, forked and edited by Brittany Chiu (2021-2022)

	Original: https://github.com/ProminentEdge/leaflet-measure-path
	Forked and Edited: https://github.com/brittanychiu/leaflet-measure-path
*/
!(function() {
    'use strict';

    L.Marker.Measurement = L[L.Layer ? 'Layer' : 'Class'].extend({
        options: {
            pane: 'markerPane',
            color: 'black'
        },

        initialize: function(latlng, measurement, title, rotation, options) {
            L.setOptions(this, options);

            this._latlng = latlng;
            this._measurement = measurement;
            this._title = title;
            this._rotation = rotation;
        },

        addTo: function(map) {
            map.addLayer(this);
            return this;
        },

        onAdd: function(map) {
            this._map = map;
            // for circles
            if(this.options.fillColor) {
                this.options.color = this.options.fillColor;
            }
            var pane = this.getPane ? this.getPane() : map.getPanes().markerPane;
            var el = this._element = L.DomUtil.create('div', 'leaflet-zoom-animated leaflet-measure-path-measurement', pane);
            var inner = L.DomUtil.create('div', 'measurement-label', el);
            inner.title = this._title;
            inner.style.color = this.options.color;
            inner.innerHTML = this._measurement;
            
            this.inner = inner
            var currentzoom = map.getZoom();
            if(currentzoom<4){
                this._element.style.fontSize = '7px';
            }
            else if (currentzoom < 7) {
                this._element.style.fontSize = '15px';
            }
            else {
                this._element.style.fontSize = '20px';
            }
            map.on('zoomanim', this._animateZoom, this);
            
            this._setPosition();
        },

        onRemove: function(map) {
            map.off('zoomanim', this._animateZoom, this);
            var pane = this.getPane ? this.getPane() : map.getPanes().markerPane;
            pane.removeChild(this._element);
            this._map = null;
        },

        _setPosition: function() {
            L.DomUtil.setPosition(this._element, this._map.latLngToLayerPoint(this._latlng));
            this._element.style.transform += ' rotate(' + this._rotation + 'rad)';
        },
        setColor: function(newColor) {
            // for circles
            if(this.options.fillColor) {
                this.options.color = this.options.fillColor;
            }

            this.options.color = newColor;
            this.inner.style.color = this.options.color;
        },
        _animateZoom: function(opt) {
            var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
            L.DomUtil.setPosition(this._element, pos);
            this._element.style.transform += ' rotate(' + this._rotation + 'rad)';
        }
    });

    L.Marker.NameLabel = L[L.Layer ? 'Layer' : 'Class'].extend({
        options: {
            pane: 'markerPane'
        },

        initialize: function(latlng, title, color, rotation, options) {
            L.setOptions(this, options);

            this._latlng = latlng;
            this._title = title;
            this._color = color;
            this._rotation = rotation;
        },

        addTo: function(map) {
            map.addLayer(this);
            return this;
        },

        onAdd: function(map) {
            this._map = map;
            var pane = this.getPane ? this.getPane() : map.getPanes().markerPane;
            var el = this._element = L.DomUtil.create('div', 'leaflet-zoom-animated leaflet-measure-path-measurement', pane);
            var inner = L.DomUtil.create('div', 'name-label', el);

            inner.title = this._title;
            inner.style.color = this._color;
         
            inner.innerHTML = this._title;


            this.inner = inner;
            var currentzoom = map.getZoom();
            if(currentzoom<4){
                this._element.style.fontSize = '7px';
            }
            else if (currentzoom < 7) {
                this._element.style.fontSize = '15px';
            }
            else {
                this._element.style.fontSize = '20px';
            }
            map.on('zoomanim', this._animateZoom, this);
            map.on('zoomend', this._setTextSizeZoom, this);

            this._setPosition();
        },

        onRemove: function(map) {
            map.off('zoomanim', this._animateZoom, this);
            map.off('zoomend', this._setTextSizeZoom, this);
            var pane = this.getPane ? this.getPane() : map.getPanes().markerPane;
            pane.removeChild(this._element);
            this._map = null;
        },
        setColor: function(newColor) {
            this.inner.style.color = newColor;
        },
        _setPosition: function() {
            L.DomUtil.setPosition(this._element, this._map.latLngToLayerPoint(this._latlng));
            this._element.style.transform += ' rotate(' + this._rotation + 'rad)';
        },
        _setTextSizeZoom: function() {
            var currentzoom = this._map.getZoom();
            if(currentzoom<4){
                this.inner.style.fontSize = '7px';
            }
            else if (currentzoom < 7) {
                this.inner.style.fontSize = '15px';
            }
            else {
                this.inner.style.fontSize = '20px';
            }
        },
        _animateZoom: function(opt) {
            var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
            L.DomUtil.setPosition(this._element, pos);
            this._element.style.transform += ' rotate(' + this._rotation + 'rad)';
        }
    });

    L.marker.measurement = function(latLng, measurement, title, rotation, options) {
        return new L.Marker.Measurement(latLng, measurement, title, rotation, options);
    };

    L.marker.nameLabel = function(latLng, title, color, rotation, options) {
        return new L.Marker.NameLabel(latLng, title, color, rotation, options);
    }

    var formatDistance = function(d) {
        var unit;

        if ( this._options.measurementType === "mi" ) {
            d = d / 1609.34;
            unit = "mi";
        } else if (this._options.measurementType === "nm") { 
            d = d / 1852;
            unit = "nm";
        }
        else {
            if (d > 1000) {
                d = d / 1000;
                unit = 'km';
            } else {
                unit = 'm';
            }
        }

        if (d < 100) {
            return d.toFixed(1) + ' ' + unit;
        } else {
            return Math.round(d) + ' ' + unit;
        }
    }

    var formatArea = function(a) {
        var unit;

        if (this._options.measurementType === "mi" ) {  // to miles
            a = a  / Math.pow(1609.34, 2);;
            unit = 'mi²';
        } else if (this._options.measurementType === "nm") { //to nautical miles
            a = a / Math.pow(1852, 2);
            unit = 'nm²';
        } else {
            if (a > 1000000) {
                a = a / 1000000;
                unit = 'km²';
            } else {
                unit = 'm²';
            }
        }

        if (a < 100) {
            return a.toFixed(1) + ' ' + unit;
        } else {
            return Math.round(a) + ' ' + unit;
        }
    }

    var RADIUS = 6378137;
    // ringArea function copied from geojson-area
    // (https://github.com/mapbox/geojson-area)
    // This function is distributed under a separate license,
    // see LICENSE.md.
    var ringArea = function ringArea(coords) {
        var rad = function rad(_) {
            return _ * Math.PI / 180;
        };
        var p1, p2, p3, lowerIndex, middleIndex, upperIndex,
        area = 0,
        coordsLength = coords.length;

        if (coordsLength > 2) {
            for (var i = 0; i < coordsLength; i++) {
                if (i === coordsLength - 2) {// i = N-2
                    lowerIndex = coordsLength - 2;
                    middleIndex = coordsLength -1;
                    upperIndex = 0;
                } else if (i === coordsLength - 1) {// i = N-1
                    lowerIndex = coordsLength - 1;
                    middleIndex = 0;
                    upperIndex = 1;
                } else { // i = 0 to N-3
                    lowerIndex = i;
                    middleIndex = i+1;
                    upperIndex = i+2;
                }
                p1 = coords[lowerIndex];
                p2 = coords[middleIndex];
                p3 = coords[upperIndex];
                area += ( rad(p3.lng) - rad(p1.lng) ) * Math.sin( rad(p2.lat));
            }

            area = area * RADIUS * RADIUS / 2;
        }

        return Math.abs(area);
    };
    /**
     * Handles the init hook for polylines and circles.
     * Implements the showOnHover functionality if called for.
     */
    var addInitHook = function() {
        var showOnHover = false;
        if (this.options.showMeasurements && !showOnHover) {
            this.showMeasurements(this._options);
        }
        if(this.options.measurementType && this.options.showMeasurements && showOnHover){
            this.on('mouseover', function() {
                this.showMeasurements(this._options);
            });
            this.on('mouseout', function() {
                this.hideMeasurements();
            });
        }
    };

    var circleArea = function circleArea(d) {
        return Math.PI * Math.pow(d, 2);
    };

    var override = function(method, fn, hookAfter) {
        if (!hookAfter) {
            return function() {
                var originalReturnValue = method.apply(this, arguments);
                var args = Array.prototype.slice.call(arguments)
                args.push(originalReturnValue);
                return fn.apply(this, args);
            }
        } else {
            return function() {
                fn.apply(this, arguments);
                return method.apply(this, arguments);
            }
        }
    };

    L.Polyline.include({
        showNameLabel:function() {
            if (!this._map || this._labelLayer) return this;

            this._options = L.extend({
                showOnHover: false,
                showLabel: true
            }, this._options || {});

            this._labelLayer = L.layerGroup().addTo(this._map);
            this.updateLabel();

            this._map.on('zoomend', this.updateLabel, this);

            return this;
        },
        hideNameLabel: function() {
            if (!this._map) return this;

            this._map.on('zoomend', this.updateLabel, this);

            if (!this._labelLayer) return this;
            this._map.removeLayer(this._labelLayer);
            this._labelLayer = null;

            return this;
        },
        showMeasurements: function(options) {
            if (!this._map || this._measurementLayer) return this;

            this._options = L.extend({
                minPixelDistance: 30,
                showDistances: true,
                measurementType: (options && options.measurementType) || "km",
                showArea: true,
                showTotalDistance: true,
                lang: {
                    totalLength: 'Total length',
                    totalArea: 'Total area',
                    segmentLength: 'Segment length'
                }
            }, this._options || {});

            this._measurementLayer = L.layerGroup().addTo(this._map);
            this.updateMeasurements(options);

            this._map.on('zoomend', this.updateMeasurements, this);

            return this;
        },

        hideMeasurements: function() {
            if (!this._map) return this;

            this._map.off('zoomend', this.updateMeasurements, this);

            if (!this._measurementLayer) return this;
            this._map.removeLayer(this._measurementLayer);
            this._measurementLayer = null;

            return this;
        },

        onAdd: override(L.Polyline.prototype.onAdd, function(originalReturnValue) {
            var showOnHover = false;
            if (this.options.showMeasurements && !showOnHover) {
                this.showMeasurements(this._options);
            }

            return originalReturnValue;
        }),

        onRemove: override(L.Polyline.prototype.onRemove, function(originalReturnValue) {
            this.hideMeasurements();
            this.hideNameLabel()

            return originalReturnValue;
        }, true),

        setLatLngs: override(L.Polyline.prototype.setLatLngs, function(originalReturnValue) {
            this.updateMeasurements();

            return originalReturnValue;
        }),

        spliceLatLngs: override(L.Polyline.prototype.spliceLatLngs, function(originalReturnValue) {
            this.updateMeasurements();

            return originalReturnValue;
        }),

        formatDistance: formatDistance,
        formatArea: formatArea,
        updateLabel: function() {
            if (!this._labelLayer) return this;

            var latLngs = this.getLatLngs(),
                isPolygon = this instanceof L.Polygon,
                options = this._options
           
                if(this._options.color){
                    this._labelLayer.clearLayers();
    
                    // need to get bottom center
                    var latLngLabel = $.extend(true, {}, latLngs)
                    latLngLabel.lng = this.getBounds().getCenter().lng;
                    latLngLabel.lat = this.getBounds()._southWest.lat;
    
                    L.marker.nameLabel(latLngLabel, this._options.id, this._options.color, 0, options)
                        .addTo(this._labelLayer);
                }

            return this; 
        },
        updateColor: function(newColor){
            if(this._measurementLayer){
                this._measurementLayer.getLayers().forEach(function(element) {
                    element.setColor(newColor)
                });    
            }

            if(this._labelLayer){
                this._labelLayer.getLayers().forEach(function(element){
                    element.setColor(newColor)
                })
            }       
        },
        updateMeasurements: function(options) {
            if (!this._measurementLayer) return this;

            var latLngs = this.getLatLngs(),
                isPolygon = this instanceof L.Polygon,
                options = this._options,
                totalDist = 0,
                formatter,
                ll1,
                ll2,
                p1,
                p2,
                pixelDist,
                dist;

            if (latLngs && latLngs.length && L.Util.isArray(latLngs[0])) {
                // Outer ring is stored as an array in the first element,
                // use that instead.
                latLngs = latLngs[0];
            }

            if (this._options.showMeasurements && latLngs.length > 1) {
                this._measurementLayer.clearLayers();
                formatter = this._options.formatDistance || L.bind(this.formatDistance, this);

                for (var i = 1, len = latLngs.length; (isPolygon && i <= len) || i < len; i++) {
                    ll1 = latLngs[i - 1];
                    ll2 = latLngs[i % len];
                    dist = ll1.distanceTo(ll2);
                    totalDist += dist;

                    p1 = this._map.latLngToLayerPoint(ll1);
                    p2 = this._map.latLngToLayerPoint(ll2);

                    pixelDist = p1.distanceTo(p2);

                    if (pixelDist >= options.minPixelDistance) {
                        L.marker.measurement(
                            this._map.layerPointToLatLng([(p1.x + p2.x) / 2, (p1.y + p2.y) / 2]),
                            formatter(dist), options.lang.segmentLength, this._getRotation(ll1, ll2), options)
                            .addTo(this._measurementLayer);
                    }
                }

                // Show total length for polylines
                if (!isPolygon && this._options.showTotalDistance) {
                    L.marker.measurement(ll2, formatter(totalDist), options.lang.totalLength, 0, options)
                        .addTo(this._measurementLayer);
                }
            }

            if (isPolygon && options.showArea && latLngs.length > 2) {
                formatter = options.formatArea || L.bind(this.formatArea, this);
                var area = ringArea(latLngs);
                L.marker.measurement(this.getBounds().getCenter(),
                    formatter(area), options.lang.totalArea, 0, options)
                    .addTo(this._measurementLayer);
            }

            return this;
        },
        updateMeasurementsAndLabel: function() {
            this.updateMeasurements();
            this.updateLabel();
        },
        _getRotation: function(ll1, ll2) {
            var p1 = this._map.project(ll1),
                p2 = this._map.project(ll2);

            return Math.atan((p2.y - p1.y) / (p2.x - p1.x));
        }
    });

    L.Polyline.addInitHook(function() {
        addInitHook.call(this);
    });

    L.Circle.include({
        showNameLabel:function() {
            if (!this._map || this._labelLayer) return this;

            this._options = L.extend({
                showOnHover: false,
                showLabel: true
            }, this._options || {});

            this._labelLayer = L.layerGroup().addTo(this._map);

            if(this._options.lang) {
                this.updateLabel();
            }

            this._map.on('zoomend', this.updateLabel, this);

            return this;
        },
        hideNameLabel: function() {
            if (!this._map) return this;

            this._map.on('zoomend', this.updateLabel, this);

            if (!this._labelLayer) return this;
            this._map.removeLayer(this._labelLayer);
            this._labelLayer = null;

            return this;
        },
        showMeasurements: function(options) {
            if (!this._map || this._measurementLayer) return this;

            this._options = L.extend({
                showOnHover: false,
                showArea: true,
                lang: {
                    totalArea: 'Total area',
                }
            }, options || {});

            this._measurementLayer = L.layerGroup().addTo(this._map);
            this.updateMeasurements();

            this._map.on('zoomend', this.updateMeasurements, this);

            return this;
        },

        hideMeasurements: function() {
            if (!this._map) return this;

            this._map.on('zoomend', this.updateMeasurements, this);

            if (!this._measurementLayer) return this;
            this._map.removeLayer(this._measurementLayer);
            this._measurementLayer = null;

            return this;
        },

        onAdd: override(L.Circle.prototype.onAdd, function(originalReturnValue) {
            var showOnHover = false;
            if (this.options.showMeasurements && !showOnHover) {
                this.showMeasurements();
            }

            return originalReturnValue;
        }),

        onRemove: override(L.Circle.prototype.onRemove, function(originalReturnValue) {
            this.hideMeasurements();
            this.hideNameLabel();

            return originalReturnValue;
        }, true),

        setLatLng: override(L.Circle.prototype.setLatLng, function(originalReturnValue) {
            this.updateMeasurements();

            return originalReturnValue;
        }),

        setRadius: override(L.Circle.prototype.setRadius, function(originalReturnValue) {
            this.updateMeasurements();

            return originalReturnValue;
        }),

        formatArea: formatArea,
        updateLabel: function() {
            if (!this._labelLayer) return;

            var latLngLabel = $.extend(true, {}, this.getLatLng());

            latLngLabel.lat = this.getBounds()._southWest.lat;

            if (this._options.fillColor) {
                this._labelLayer.clearLayers();
                L.marker.nameLabel(latLngLabel, this._options.id, this._options.fillColor, 0, {})
                    .addTo(this._labelLayer);
            }
        },
        updateColor: function(newColor){
            if(this._measurementLayer){
                this._measurementLayer.getLayers().forEach(function(element) {
                    element.setColor(newColor)
                });    
            }

            if(this._labelLayer){
                this._labelLayer.getLayers().forEach(function(element){
                    element.setColor(newColor)
                })
            }       
        },
        updateMeasurements: function(options) {
            if (!this._measurementLayer) return;

            var latLng = this.getLatLng(),
                options = this._options,
                formatter = options.formatArea || L.bind(this.formatArea, this);

            var latLngLabel = $.extend(true, {}, latLng);

            latLngLabel.lng = this.getBounds().getCenter().lng;
            latLngLabel.lat = this.getBounds()._southWest.lat;

            if (options.showArea) {
                this._measurementLayer.clearLayers();
                formatter = options.formatArea || L.bind(this.formatArea, this);
                var area = circleArea(this.getRadius());
                L.marker.measurement(latLngLabel,
                    formatter(area), options.lang.totalArea, 0, options)
                    .addTo(this._measurementLayer);
            }
        },
        updateMeasurementsAndLabel: function() {
            this.updateMeasurements();
            this.updateLabel();
        }
    })

    L.Circle.addInitHook(function() {
        addInitHook.call(this);
    });
})();
