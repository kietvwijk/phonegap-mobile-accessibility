/**
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    device = require('cordova-plugin-device.device')

var MobileAccessibility = function() {
    this._usePreferredTextZoom = false;
};

/**
 *
 * Event handlers for when callback methods get registered for mobileAccessibility.
 * Keep track of how many handlers we have so we can start and stop the native MobileAccessibility listener
 * appropriately.
 * @private
 * @ignore
 */
MobileAccessibility.onHasSubscribersChange = function() {
    // If we just registered the first handler, make sure native listener is started.
    if (this.numHandlers === 1 && handlers() === 1) {
        exec(mobileAccessibility._status, mobileAccessibility._error, "MobileAccessibility", "start", []);
    } else if (handlers() === 0) {
        exec(null, null, "MobileAccessibility", "stop", []);
    }
};

MobileAccessibility.prototype.scriptInjected = false;
MobileAccessibility.prototype.injectLocalAndroidVoxScript = function() {
    var versionsplit = device.version.split('.');
    if (device.platform !== "Android" ||
        !(versionsplit[0] > 4 || (versionsplit[0] == 4 && versionsplit[1] >= 1))  ||
        typeof cvox !== "undefined" || mobileAccessibility.scriptInjected) return;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = function(){
        // console.log(this.src + ' has loaded');
        if (mobileAccessibility.isChromeVoxActive()) {
            cordova.fireWindowEvent("screenreaderstatuschanged", {
                isScreenReaderRunning: true
            });
        }
    };

    script.src = (versionsplit[0] > 4 || versionsplit[1] > 3)
        ? "plugins/com.phonegap.plugin.mobile-accessibility/android/chromeandroidvox.js"
        : "plugins/com.phonegap.plugin.mobile-accessibility/android/AndroidVox_v1.js";
    document.getElementsByTagName('head')[0].appendChild(script);
    mobileAccessibility.scriptInjected = true;
};

/**
 * Asynchronous call to native MobileAccessibility to return the current text zoom percent value for the WebView.
 * @param {function} callback A callback method to receive the asynchronous result from the native MobileAccessibility.
 */
MobileAccessibility.prototype.getTextZoom = function(callback) {
    exec(callback, null, "MobileAccessibility", "getTextZoom", []);
};

/**
 * Asynchronous call to native MobileAccessibility to set the current text zoom percent value for the WebView.
 * @param {Number} textZoom A percentage value by which text in the WebView should be scaled.
 * @param {function} callback A callback method to receive the asynchronous result from the native MobileAccessibility.
 */
MobileAccessibility.prototype.setTextZoom = function(textZoom, callback) {
    exec(callback, null, "MobileAccessibility", "setTextZoom", [textZoom]);
};

/**
 * Asynchronous call to native MobileAccessibility to retrieve the user's preferred text zoom from system settings and apply it to the application WebView.
 * @param {function} callback A callback method to receive the asynchronous result from the native MobileAccessibility.
 */
MobileAccessibility.prototype.updateTextZoom = function(callback) {
    exec(callback, null, "MobileAccessibility", "updateTextZoom", []);
};

MobileAccessibility.prototype.usePreferredTextZoom = function(bool) {
    var currentValue = window.localStorage.getItem("MobileAccessibility.usePreferredTextZoom") === "true";

    if (arguments.length === 0) {
        return currentValue;
    }

    if (currentValue != bool) {
        window.localStorage.setItem("MobileAccessibility.usePreferredTextZoom", bool);
    }

    var callback = function(){
        // Wrapping updateTextZoom call in a function to stop
        // the event parameter propagation. This fixes an error
        // on resume where cordova tried to call apply() on the
        // event, expecting a function.
        mobileAccessibility.updateTextZoom();
    };

    document.removeEventListener("resume", callback);

    if (bool) {
        // console.log("We should update the text zoom at this point: " + bool)
        document.addEventListener("resume", callback, false);
        mobileAccessibility.updateTextZoom();
    } else {
        mobileAccessibility.setTextZoom(100);
    }

    return Boolean(bool);
};

/**
 * Error callback for MobileAccessibility start
 */
MobileAccessibility.prototype._error = function(e) {
    console.log("Error initializing MobileAccessibility: " + e);
};

var mobileAccessibility = new MobileAccessibility();

module.exports = mobileAccessibility;
