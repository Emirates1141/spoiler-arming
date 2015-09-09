// ==UserScript==
// @name GEFS-Online Spoilers Arming
// @description This extension (by Harry Xue) allows the user to arm the spoilers before landing.
// @namespace GEFS-Plugins
// @match http://www.gefs-online.com/gefs.php*
// @match http://gefs-online.com/gefs.php*
// @run-at document-end
// @version 0.1.5.patch-1
// @grant none
// ==/UserScript==

(function (initArm, initUI) {
	// Inits UI elements
	initUI();

	// Checks if the game completes loading
	// and if all needed objects are created
	// Inits arming
	var timer = setInterval(function () {
		if (window.ges && ges.aircraft && ges.aircraft.object3d) {
			clearInterval(timer);
			initArm();
		}
	}, 16);
})(function () {
	var armed = false; // If spoilers are armed
	var enabled = true;	// If spoilers are eligible to be armed
	var targetAlt = 4000; // The AGL altitude which the timer will update faster
	var spoilersTimer; // The timer to check for groundContact

	/**
 	 * Checks for spoilers arming status, set on a timer
 	 */
	function armSpoilers() {
		// The current "At Ground Level" of the plane
		var AGL = ges.aircraft.animationValue.altitude - ges.groundElevation * metersToFeet;

		if (ges.aircraft.groundContact && ges.aircraft.animationValue.airbrakesPosition === 0) {
			controls.setters.setAirbrakes.set();
			armed = false;
			checkStatus();
			return;
		} else if (ges.aircraft.groundContact) {
			armed = false;
			checkStatus();
			return;
		}
		clearInterval(spoilersTimer);
		if (AGL <= targetAlt) spoilersTimer = setInterval(armSpoilers, 1500);
		else spoilersTimer = setInterval(armSpoilers, 30000);
	}
	
	/**
	 * Checks for arming status and controls the timer
	 */
	function checkStatus() {
		// If the plane does not have spoilers
		if (!instruments.list.spoilers) {
			disable();
			clearInterval(spoilersTimer);
		} else {
			if (armed) {
				update();
				spoilersTimer = setInterval(armSpoilers, 1500);
			} else {
				update();
				clearInterval(spoilersTimer);
			}
		}
	}

	/**
 	 * Updates the button to show armed status
 	 * Enables arming if eligible
 	 */
	function update() {
		if (!enabled) {
			enabled = true;
			$('#spoilers-arming')
				.removeClass('btn-danger')
				.addClass('btn-default');
		} else {
			if (armed) $('#spoilers-arming')
				.removeClass('btn-default')
				.addClass('btn-success');
			else $('#spoilers-arming')
				.removeClass('btn-success')
				.addClass('btn-default');
		}
	}

	/**
	 * Disables arming
	 */
	function disable() {
		enabled = false;
		if (!armed) $('#spoilers-arming')
			.removeClass('btn-default')
			.addClass('btn-danger');
		if (armed) $('#spoilers-arming')
			.removeClass('btn-success')
			.addClass('btn-danger');
		armed = false;
	}

	/**
	 * Checks for arming eligibility after page load
 	 */
	$(function () {
		checkStatus();
	});

	/**
	 * Checks for "click" on the spoilers arming button
 	 */
	$('#spoilers-arming').click(function () {
		if (enabled) {
			if (!ges.aircraft.groundContact) armed = !armed;
			else armed = false;
			checkStatus();
		}
	});

	/**
	 * Checks for "\" keydown to set spoilers
	 */
	$(document).keydown(function (event) {
		if (event.which === 220 || event.keyCode === 220)
			$('#spoilers-arming').click();
	});

	/**
 	 * Redefines load function of Aircraft so that it 
 	 * checks for availability on aircraft load
	 */
	var oldLoad = Aircraft.prototype.load;
	Aircraft.prototype.load = function (aircraftName, coordinates, bJustReload) {
		// Obtains the old aircraft parts {Object} before loading
		var oldParts = ges.aircraft.object3d._children;

		// Calls the original function to load an aircraft
		oldLoad.call(this, aircraftName, coordinates, bJustReload);

		// Checks if the old parts refer to a different object compared 
		// with the current parts. It's crucial to set on a timer because 
		// it takes time for the models to load completely
		var timer = setInterval(function () {
			if (oldParts !== ges.aircraft.object3d._children) {
				clearInterval(timer);
				armed = false;
				checkStatus();
			}
		}, 16);
	};
}, function () {
		// Spoilers arming UI
		var spoilersArmUI = $('<div>')
			.addClass('setup-section')
			.css('padding-bottom', '0px')
			.append($('<div>')
				.addClass('input-prepend input-append')
				.css('margin-bottom', '4px')
				.append($('<span>')
					.addClass('add-on')
					.text('Spoilers'),
				$('<button>')
					.addClass('btn btn-default')
					.attr('type', 'button')
					.css('height', '30px')
					.css('width', '30px')
					.attr('id', 'spoilers-arming')
				)
			).appendTo('.gefs-f-standard');
});
