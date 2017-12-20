$(function(){

	function eventConstructor (date, horaire, lieu, nomRando, departement, contact, description, lieuRdv, organisateur, prixClub, prixPublic){
	  var event = 
	  '<div class="row event">'+
	    '<div class="col-sm-12">'+
		  '<div class="row text-bold">'+
            '<div class="col-sm-2 spacer-sm-top">'+
              '<span class="d-block"><i class="far fa-calendar" aria-hidden="true"></i> ' + date +'</span>'+
            '</div>'+
            '<div class="col-sm-2 spacer-sm-top">'+
              '<span class="d-block"><i class="fa fa-map-marker-alt" aria-hidden="true"></i> ' + lieu + '</span>'+
            '</div>'+
            '<div class="col-sm-7">'+
              '<p class="text-primary spacer-sm-top text-uppercase">' + departement + ' - ' + nomRando + '</p>'+
            '</div>'+
            '<div class="col-sm-1 read-more">'+
              '<i class="fas fa-chevron-circle-right"></i>'+
            '</div>'+
          '</div>'+
          '<div class="row hidde text-left">'+
            '<div class="col-sm-8 spacer-sm-top">'+
            '<span class="d-block"><p> Description</p></span>'+
              '<span class="d-block"><p> ' + description + '</p></span>'+
            '</div>'+
            '<div class="col-sm-4 spacer-sm-top">'+
              '<span class="d-block"><p> Horaires : ' + horaire + '</p></span>'+
              '<span class="d-block"><p> Département : ' + lieuRdv + '</p></span>'+
              '<span class="d-block"><p> Lieu de rendez-vous : ' + lieuRdv + '</p></span>'+
              '<span class="d-block"><p> Organisateur : ' + organisateur + '</p></span>'+
              '<span class="d-block"><p> Contact : ' + contact + '</p></span>'+
              '<span class="d-block"><p> Prix Club : ' + prixClub + '</p></span>'+
              '<span class="d-block"><p> Prix Public : ' + prixPublic + '</p></span>'+
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
		$('#waiting').remove()
		console.log(data[0])
		$.each( data, ( key, val ) => {
			$(eventConstructor(val.date, val.horaire, val.lieu, val.nomRando, val.departement, val.contact, val.description, val.lieuRdv, val.organisateur, val.prixClub, val.prixPublic)).appendTo("#calendar-ajax")
		});
	});

	$(document).on('click', '.event', function (){
		var selector = $(this.children[0].children[0].children[3].children[0])
		var readMore = $(this.children[0].children[1])
		var event = $(this)

		selector.toggleClass('fa-chevron-circle-right')
		selector.toggleClass('fa-chevron-circle-down')
		readMore.toggleClass('hidde')
		event.toggleClass('bg-light')
	})
})