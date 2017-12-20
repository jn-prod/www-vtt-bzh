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
	CALDENDAR
	------*/

	/*Event init*/
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