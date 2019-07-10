$(function(){

  var dateNow = new Date(Date.now())

  function eventConstructor (date, horaire, lieu, nomRando, departement, contact, description, lieuRdv, organisateur, prixClub, prixPublic, cancel) {
    var cancelDiv = ''
    if (cancel === true) {
      cancelDiv = '<span class="badge badge-danger text-uppercase">annulée</span>'
    }
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
              '<p class="event-name text-primary spacer-sm-top text-uppercase">' + nomRando + ' ' + cancelDiv + '</p>'+
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
              // '<span class="d-block"><p> Prix Public : ' + prixPublic + '</p></span>'+
            '</div>'+           
          '</div>'+
        '</div>'+
      '</div>'

      return event
  }

  function avisConstructor (date, rate, comment, author, short) {
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
  GLOBAL
  ------*/  

  if($('#calendar').length === 0){
    $('#newsletter').remove()
    $('#header-cta').remove() 
  } else {
    $('#newsletter').removeClass('hidde')
  }

  if($('#landing').length === 0 && $('#calendar').length === 0){
    $('#header-wrapper').css('height', '120px').css('min-height', '120px')
  }

  /*------
  NEWSLETTER
  ------*/

  $('#close').on('click', function() {
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
    var dpt = ""

    //load json
    function programme () {//startYear, startMonth, startDay, endYear, endMonth, endDay
      //query test url: https://api-vtt-bzh.herokuapp.com/calendar/api/vtt?start_year=2018&start_month=5&start_day=1&end_year=2018&end_month=5&end_day=20
      $.getJSON( "events.json" , function( data ) {
        
        nbProgramme = data.length

        $('#nombre_rando').text(data.length + " randonnées")

        $('.premium').remove()

        //console.log(data[0])
        $.each( data, function( key, val ) {
          if(key >= nbProgrammeStart && key < nbProgrammeEnd) {

            if(val.date){ 
              //define date display
              var day = val.date.split('/')[0]
              var month = val.date.split('/')[1]
              var year = val.date.split('/')[2]

              var date = new Date(year, month, day)
              var dateDisplay = date.getDate() + '/' + ( date.getMonth() + 1 ) + '/' + date.getFullYear();
              
              //construction de l'évènement
              $(eventConstructor(dateDisplay, val.hour, val.city, val.name, val.departement, val.contact, val.description, val.city, val.organisateur, val.price, val.prix_public, val.cancel)).appendTo("#calendar-ajax")

            } else {
              nbProgrammeStart++
              nbProgrammeEnd++
            }
                     
          }
        });

        $('.event').each(function(i){
          if ((i % 20) == 0) {
            //console.log($('.event')[i])
            $(cta).insertBefore($('.event')[i])
          }          
        }) 

        $('#waiting').remove()

        if(nbProgrammeEnd >= nbProgramme){
          $('#load-more').addClass('hidde')
        } else {
          $('#load-more').removeClass('hidde')
        }

      }) 
    }

    function setSelectedIndex (s, valsearch){ 
      // Loop through all the items in drop down list   
      for (i = 0; i< s.options.length; i++) {    
        if (s.options[i].value == valsearch) {    
          s.options[i].selected = true;   
          break
        }   
      }   
      return         
    }

    //load Json
    programme()

    //Init search bar with this startdate & this enddate ( n+1 default )
    setSelectedIndex( document.getElementById("startYear" ), startYear );
    setSelectedIndex( document.getElementById("startMonth" ), startMonth ); 
    setSelectedIndex( document.getElementById("startDay" ), startDay ); 
    setSelectedIndex( document.getElementById("endYear" ), endYear ); 
    setSelectedIndex( document.getElementById("endMonth" ), endMonth ); 
    setSelectedIndex( document.getElementById("endDay" ), endDay ); 

    $('#search-button').on('click', function() {

      $('.event').remove()   

      nbProgrammeStart = 0
      nbProgrammeEnd = nbProgrammeStart + gap
    
      startYear = $('#startYear').val() * 1
      startMonth = $('#startMonth').val() * 1
      startDay = $('#startDay').val() * 1
      endYear = $('#endYear').val() * 1
      endMonth = $('#endMonth').val() * 1
      endDay = $('#endDay').val() * 1

      dpt = $('#dpt').val()

      if( dpt === 0 ) {
        dpt = ""
      }

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

      if(nbProgrammeEnd >= nbProgramme){
        $('#load-more').addClass('hidde')
      }
    })
  }
})
