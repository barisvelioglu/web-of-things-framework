﻿var events = require("events");
var logger = require('../logger');
var db = require('../data/db')();
var wot = require('../framework');
var simulator = require('./simulator_remote');
var eventh = require('../libs/events/thingevents');

var device = function () {

    var self = this;
    
    //  Listen on the event emitter
    //  The properties and events are defined in the thing model. The thing is notified about these by using the below event and property event listener.
    //  The event which the listeners are listening on are signalled by the device driver in case of local proxies or 
    //  by the REST HTTP end point in case of remote proxies.
    self.onProperty = function (name, callback) {
        eventh.emitter.on('device_property_changed', function (msg) {
            try {
                if (!msg || !msg.name || msg.name != name) {
                    return;
                }
                
                callback(null, msg.property, msg.value);                
            }
            catch (e) {
                logger.error(e);
            }
        });
    };
    
    self.onEvent = function (name, callback) {
        eventh.emitter.on('device_event_signalled', function (msg) {
            try {
                if (!msg || !msg.name || msg.name != name) {
                    return;
                }
                
                callback(null, msg.event, msg.data);
            }
            catch (e) {
                logger.error(e);
            }
        });
    };
    
    self.setProperty = function (name, property, value) {
        logger.debug("send patch to device: " + property + ", value " + value);
        var msg = {
            type: 'patch',
            name: name,
            property: property,
            value: value
        };
        eventh.onDeviceMessage(msg);
    }
    
    self.action = function (name, action) {
        logger.debug("invoke action " + action + " at device simulator");
        var msg = {
            type: 'action',
            name: name,
            action: action
        };
        eventh.onDeviceMessage(msg);
    }

    return self;
};

var d = new device();

var things = [
    {
        "thing": function (callback) {
            db.find_thing("pump12", callback);
        },        
        "implementation": {
            start: function (thing) {
                d.onProperty("pump12", function (err, property, value) {
                    thing[property] = value;
                    //logger.debug("property: " + property + " value: " + value);
                });
                //thing.pressure = 1.014;
                //thing.on = true;
            },
            stop: function (thing) { },
            patch: function (thing, property, value) {
                d.setProperty("pump12", property, value);
            }
        }
    }
];

// call the framework initialisation method and pass an array of things definitions to the framework
// for this demo the things are defined here
try {
    logger.debug("Calling framework init()");
    wot.init(things);
}
catch (e) {
    logger.error("Error in initialising framework " + e.message);
}

// start the device simulator
simulator.start();


