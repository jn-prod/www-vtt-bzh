$(function(){

  var dateNow = new Date(Date.now())

	var eventConstructor = (date, horaire, lieu, nomRando, departement, contact, description, lieuRdv, organisateur, prixClub, prixPublic) => {
	  var event = 
	  '<div class="row event">'+
	    '<div class="col-sm-12">'+
		  '<div class="row text-bold">'+
            '<div class="col-sm-2 spacer-sm-top">'+
              '<span class="d-block"><i class="far fa-calendar" aria-hidden="true"></i> ' + date +'</span>'+
            '</div>'+
            '<div class="col-sm-2 spacer-sm-top">'+
              '<span class="d-block"><i class="fa fa-map-marker-alt" aria-hidden="true"></i> ' + departement + ' - ' + lieu + '</span>'+
            '</div>'+
            '<div class="col-sm-7">'+
              '<p class="event-name text-primary spacer-sm-top text-uppercase">' + nomRando + '</p>'+
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
              '<span class="d-block"><p> Département : ' + departement + '</p></span>'+
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

  var avisConstructor = (date, rate, comment, author, short)=>{
    var avisDetails = 
      '<div class="row">' +
        '<div class="col-12 bg-light spacer-sm-top">' +
          '<div class="spacer-md-top"></div>' +
          '<p>' + rate + ' - ' + short + '</p>'+
          '<p>' + ' ' + date + ' ' + author + '</p>'+
          '<p>' + comment + '</p>'+
        '</div>' +
      '</div>'

    return avisDetails
  }
  /*------
  NEWSLETTER
  ------*/

  $('#close').on('click', ()=>{
    $('#newsletter').remove()
  })
  
	/*------
	CALDENDAR
	------*/

  /*Event init*/
  if($('#calendar').length !== 0) {
    var gap = 20,
        nbProgrammeStart = 0,
        nbProgrammeEnd = nbProgrammeStart + gap,
        nbProgramme;

      var cta =
        '<div class="row bg-light premium">'+
          '<div class="col-12 text-center">'+
            '<p class="text-bold spacer-lg-top">Passez à VTT.bzh PREMIUM maintenant et recevez le programme de rando chaque semaine par email</p>'+
            '<a href="/premium.html" class="btn btn-secondary text-uppercase text-bold spacer-lg-bottom">Abonnez-vous à VTT.bzh Premium</a>'+
          '</div>'
        '</div>'

    // date init
    var dateFilterStart = new Date(Date.now() )
    var dateFilterEnd = new Date( Date.UTC( dateFilterStart.getFullYear() + 1, dateFilterStart.getMonth(), dateFilterStart.getDate() ) )

    var startYear = dateFilterStart.getFullYear()
    var startMonth = dateFilterStart.getMonth() + 1
    var startDay = dateFilterStart.getDate()
    var endYear = dateFilterEnd.getFullYear()
    var endMonth = dateFilterEnd.getMonth() + 1
    var endDay = dateFilterEnd.getDate()

    //load json
    var programme = ()=>{//startYear, startMonth, startDay, endYear, endMonth, endDay
      //query test url: https://api-vtt-bzh.herokuapp.com/calendar/api/vtt?start_year=2018&start_month=5&start_day=1&end_year=2018&end_month=5&end_day=20
      $.getJSON( "https://api-vtt-bzh.herokuapp.com/calendar/api/vtt?start_year=" + startYear + "&start_month=" + startMonth + "&start_day=" + startDay + "&end_year=" + endYear + "&end_month=" + endMonth + "&end_day=" + endDay, ( data ) => {
        
        nbProgramme = data.length

        $('#nombre_rando').text(data.length + " randonnées")

        $('.premium').remove()

        //console.log(data[0])
        $.each( data, ( key, val ) => {
          if(key >= nbProgrammeStart && key < nbProgrammeEnd) {

            if(val.date){ 
              //definition de la date à display
              var date = new Date(val.date)
              var dateDisplay = date.getDate() + '/' + ( date.getMonth() + 1 ) + '/' + date.getFullYear();
              
              //construction de l'évènement
              $(eventConstructor(dateDisplay, val.horaire, val.ville, val.event_name, val.departement, val.contact, val.description, val.lieu_rdv, val.organisateur, val.prix_club, val.prix_public)).appendTo("#calendar-ajax")

            } else {
              nbProgrammeStart++
              nbProgrammeEnd++
            }
                     
          }
        });

        $('.event').each((i)=>{
          if ((i % 20) == 0) {
            //console.log($('.event')[i])
            $(cta).insertBefore($('.event')[i])
          }          
        }) 

        $('#waiting').remove()

        if(nbProgramme <= gap){
          $('#load-more').addClass('hidde')
        } else {
          $('#load-more').removeClass('hidde')
        }
      }) 
    }

    var searchInit = ()=>{
      console.log(startYear)
      $('#startYear-option').val(startYear)
      $('#startMonth-option').val(startMonth)
      $('#startDay-option').val(startDay)
      $('#endYear-option').val(endYear)
      $('#endMonth-option').val(endMonth)
      $('#endDay-option').val(endDay)

      var startMonthText, endMonthText

      if( startMonth === 1 ) {
        startMonthText = 'janvier'
      } else if ( startMonth === 2) {
        startMonthText = 'février'
      } else if ( startMonth === 3) {
        startMonthText = 'mars'
      } else if ( startMonth === 4) {
        startMonthText = 'avril'
      } else if ( startMonth === 5) {
        startMonthText = 'mais'
      } else if ( startMonth === 6) {
        startMonthText = 'juin'
      } else if ( startMonth === 7) {
        startMonthText = 'juillet'
      } else if ( startMonth === 8) {
        startMonthText = 'aout'
      } else if ( startMonth === 9) {
        startMonthText = 'septembre'
      } else if ( startMonth === 10) {
        startMonthText = 'octobre'
      } else if ( startMonth === 11) {
        startMonthText = 'novembre'
      } else if ( startMonth === 12) {
        startMonthText = 'décembre'
      }

      if( endMonth === 1 ) {
        endMonthText = 'janvier'
      } else if ( endMonth === 2) {
        endMonthText = 'février'
      } else if ( endMonth === 3) {
        endMonthText = 'mars'
      } else if ( endMonth === 4) {
        endMonthText = 'avril'
      } else if ( endMonth === 5) {
        endMonthText = 'mais'
      } else if ( endMonth === 6) {
        endMonthText = 'juin'
      } else if ( endMonth === 7) {
        endMonthText = 'juillet'
      } else if ( endMonth === 8) {
        endMonthText = 'aout'
      } else if ( endMonth === 9) {
        endMonthText = 'septembre'
      } else if ( endMonth === 10) {
        endMonthText = 'octobre'
      } else if ( endMonth === 11) {
        endMonthText = 'novembre'
      } else if ( endMonth === 12) {
        endMonthText = 'décembre'
      }

      $('#startYear-option').text(startYear)
      $('#startMonth-option').text(startMonthText)
      $('#startDay-option').text(startDay)
      $('#endYear-option').text(endYear)
      $('#endMonth-option').text(endMonthText)
      $('#endDay-option').text(endDay)


    }

    programme()

    searchInit()

    $('#search-button').on('click', () => {

      $('.event').remove()   

      nbProgrammeStart = 0
      nbProgrammeEnd = nbProgrammeStart + gap
    
      startYear = $('#startYear').val() * 1
      startMonth = $('#startMonth').val() * 1
      startDay = $('#startDay').val() * 1
      endYear = $('#endYear').val() * 1
      endMonth = $('#endMonth').val() * 1
      endDay = $('#endDay').val() * 1

      programme()

    })

    /*Event Details Trigger*/
    $(document).on('click', '.event', function (){
      var selector = $(this.children[0].children[0].children[3].children[0])
      var readMore = $(this.children[0].children[1])
      var event = $(this)
      var eventName = $($(this).find('.event-name'))

      selector.toggleClass('fa-chevron-circle-right')
      selector.toggleClass('fa-chevron-circle-down')
      readMore.toggleClass('hidde')
      event.toggleClass('bg-light')
      eventName.toggleClass('text-primary-active')
      eventName.toggleClass('text-primary')
    })

    /*Event Details load-more*/
    $(document).on('click', '#load-more', function (){

      nbProgrammeStart = nbProgrammeEnd
      nbProgrammeEnd = nbProgrammeEnd + gap

      programme()

      if(nbProgrammeEnd > nbProgramme){
        $('#load-more').addClass('hidde')
      }
    })

  }


  /*------
  AVIS
  ------*/
  if($('#avis').length !== 0) {
    $.getJSON( "https://sheets.googleapis.com/v4/spreadsheets/1AMjV9P5haoZ5P3_Y9LtKSz4UxxBBejVVstBQCP-gymY/values/avis_old?key=AIzaSyCvAxjcQyPFS839MQpYLbZcykzQzeoogPA", ( data ) => {
      
      //console.log(data.values)

      $.each( data.values, ( key, val ) => {
        if(key !== 0){
          var avis =  {
            date : val[0],
            rate : val[1],
            comment : val[2],
            author : val[3],
            short : val[4]
          }

          $(avisConstructor(avis.date,avis.rate,avis.comment,avis.author,avis.short)).appendTo("#avis") 
        }      
      })
    })
  }

  /*Event init*/
	if($('#organisateurs')) {
          $('#form-post-event').on('submit',(e)=>{
		  /*
	    var forms = document.querySelectorAll("[required]");
	    forms.forEach((val)=>{
              if (val.checkValidity() === false) {
                e.preventDefault()
              }
	    });
	    */
	    var formConfirmation = confirm('Souhaitez-vous valider ces informations ?')
	    if(formConfirmation === false) {
              e.preventDefault()
	    }
	  })
	}
})
