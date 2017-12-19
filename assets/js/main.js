/*
	Alpha by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	$(function(){

		function eventConstructor (date, lieu, nomRando, departement){
		  var event = 
		  '<div class="row event">'+
		    '<div class="col-sm-12">'+
			  '<div class="row">'+
	            '<div class="col-sm-2 spacer-sm-top">'+
	              '<span class="d-block"><i class="far fa-calendar" aria-hidden="true"></i> ' + date + '</span>'+
	            '</div>'+
	            '<div class="col-sm-2 spacer-sm-top">'+
	              '<span class="d-block"><i class="fa fa-map-marker-alt" aria-hidden="true"></i> ' + lieu + '</span>'+
	            '</div>'+
	            '<div class="col-sm-7">'+
	              '<p class="text-danger spacer-sm-top text-uppercase">' + departement + ' - ' + nomRando + '</p>'+
	            '</div>'+
	            '<div class="col-sm-1 read-more">'+
	              '<i class="fas fa-chevron-circle-right"></i>'+
	            '</div>'+
	          '</div>'+
	        '</div>'+
	      '</div>'

	      return event
		}

		/*------
		POSTS
		------*/

		/*Posts init*/
		$.getJSON( "https://jn-prod.github.io/node_scrapper/exports_files/vtt_details.json", ( data ) => {
		  console.log(data[0])
		  $.each( data, ( key, val ) => {
		  	$(eventConstructor(val.date, val.lieu, val.nomRando, val.departement)).appendTo("#calendar-ajax")
		  });
		});

		$(document).on('click', '.event', function (){
			var selector = $(this.children[0].children[0].children[2].children[0])
			console.log(selector)
			selector.toggleClass('fa-chevron-circle-right')
			selector.toggleClass('fa-chevron-circle-down')
		})
	})

	skel.breakpoints({
		wide: '(max-width: 1680px)',
		normal: '(max-width: 1280px)',
		narrow: '(max-width: 980px)',
		narrower: '(max-width: 840px)',
		mobile: '(max-width: 736px)',
		mobilep: '(max-width: 480px)'
	});

	$(function() {

		var	$window = $(window),
			$body = $('body'),
			$header = $('#header'),
			$banner = $('#banner');

		// Fix: Placeholder polyfill.
			$('form').placeholder();

		// Prioritize "important" elements on narrower.
			skel.on('+narrower -narrower', function() {
				$.prioritize(
					'.important\\28 narrower\\29',
					skel.breakpoint('narrower').active
				);
			});

		// Dropdowns.
			$('#nav > ul').dropotron({
				alignment: 'right'
			});

		// Off-Canvas Navigation.

			// Navigation Button.
				$(
					'<div id="navButton">' +
						'<a href="#navPanel" class="toggle"></a>' +
					'</div>'
				)
					.appendTo($body);

			// Navigation Panel.
				$(
					'<div id="navPanel">' +
						'<nav>' +
							$('#nav').navList() +
						'</nav>' +
					'</div>'
				)
					.appendTo($body)
					.panel({
						delay: 500,
						hideOnClick: true,
						hideOnSwipe: true,
						resetScroll: true,
						resetForms: true,
						side: 'left',
						target: $body,
						visibleClass: 'navPanel-visible'
					});

			// Fix: Remove navPanel transitions on WP<10 (poor/buggy performance).
				if (skel.vars.os == 'wp' && skel.vars.osVersion < 10)
					$('#navButton, #navPanel, #page-wrapper')
						.css('transition', 'none');

		// Header.
		// If the header is using "alt" styling and #banner is present, use scrollwatch
		// to revert it back to normal styling once the user scrolls past the banner.
		// Note: This is disabled on mobile devices.
			if (!skel.vars.mobile
			&&	$header.hasClass('alt')
			&&	$banner.length > 0) {

				$window.on('load', function() {

					$banner.scrollwatch({
						delay:		0,
						range:		0.5,
						anchor:		'top',
						on:			function() { $header.addClass('alt reveal'); },
						off:		function() { $header.removeClass('alt'); }
					});

				});

			}

	});

})(jQuery);