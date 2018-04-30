$(function(){

  var dateNow = new Date(Date.now())

  function eventConstructor (date, horaire, lieu, nomRando, departement, contact, description, lieuRdv, organisateur, prixClub, prixPublic, cancel) {
    var cancelDiv = ''
    if(cancel === true){
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
              '<span class="d-block"><p> Prix Public : ' + prixPublic + '</p></span>'+
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
      $.getJSON( "https://api-vtt-bzh.herokuapp.com/calendar/api/vtt?start_year=" + startYear + "&start_month=" + startMonth + "&start_day=" + startDay + "&end_year=" + endYear + "&end_month=" + endMonth + "&end_day=" + endDay + "&dpt=" + dpt , function( data ) {
        
        nbProgramme = data.length

        $('#nombre_rando').text(data.length + " randonnées")

        $('.premium').remove()

        //console.log(data[0])
        $.each( data, function( key, val ) {
          if(key >= nbProgrammeStart && key < nbProgrammeEnd) {

            if(val.date){ 
              //definition de la date à display
              var date = new Date(val.date)
              var dateDisplay = date.getDate() + '/' + ( date.getMonth() + 1 ) + '/' + date.getFullYear();
              
              //construction de l'évènement
              $(eventConstructor(dateDisplay, val.horaire, val.ville, val.event_name, val.departement, val.contact, val.description, val.lieu_rdv, val.organisateur, val.prix_club, val.prix_public, val.cancel)).appendTo("#calendar-ajax")

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

  /*------
  COUPONS
  ------*/
  if($('#all-coupons') !== 0){
    function programme () {
      $.getJSON( "https://api-vtt-bzh.herokuapp.com/shopping/get-promotions?dpt=", function( data ) {

        //console.log(data[0])
        $.each( data, function( key, val ) {
            var date = new Date( Date.parse(val.promo_end_date) ).getDate() + '/' + (new Date( Date.parse(val.promo_end_date) ).getMonth() + 1 ) + '/' + new Date( Date.parse(val.promo_end_date) ).getFullYear()//val.promo_end_date

            var promo = 
            '<div class="row spacer-sm-top bg-light">' +
              '<div class="col-2">' +
                '<img src="' + val.shop_logo_url + '" alt="' + val.shop_name + '" class="img-fluid">' +
              '</div>' +
              '<div class="col-5">' +
                '<div class="row">' +
                  '<div class="col-12 spacer-sm-top spacer-sm-bottom">' +
                    '<strong>' + val.promo_name + '</strong> <span class="badge badge-warning"> Expire le ' + date + '</span>' +
                  '</div>' +
                '</div>' +
                '<div class="row">' +
                  '<div class="col-12 text-justify">' +
                    '<p>' + val.promo_description + '</p>'+
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="col-5">' +
                '<div class="row">' +
                  '<div class="col-12 spacer-sm-top spacer-sm-bottom">' +
                    '<strong>' + val.shop_name + '</strong>' +
                    '<ul>' +
                      '<li> adresse : ' + val.shop_adresse + ' ' + val.shop_departement + ' '+ val.shop_ville +'</li>' +
                      '<li>email : ' + val.shop_email + ' | téléphone : ' + val.shop_phone +'</li>' +
                      '<li> site web : ' + val.shop_site + '</li>' +
                    '</ul>' +
                  '</div>' +
                '</div>' +
              '</div>' +              
            '</div>'

          $('#all-coupons').append(promo)
        });

        $('#waiting').remove()

      }) 
    }

    programme()

  }

  /*------
  AVIS
  ------*/
  if($('#avis').length !== 0) {
    $.getJSON( "https://sheets.googleapis.com/v4/spreadsheets/1AMjV9P5haoZ5P3_Y9LtKSz4UxxBBejVVstBQCP-gymY/values/avis_old?key=AIzaSyCvAxjcQyPFS839MQpYLbZcykzQzeoogPA", function( data ) {
      
      //console.log(data.values)

      $.each( data.values, function( key, val ) {
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

  /*------
  EVENT ADD
  ------*/
  if($('#organisateurs') !== 0) {
    $('#form-post-event').on('submit',function(e) {
      var formConfirmation = confirm('Souhaitez-vous valider ces informations ?')
      if(formConfirmation === false) {
              e.preventDefault()
      }
    })
  }

  /*------
  CHATROOM
  ------*/
  if($('#chatroom').length !== 0) {

    $.get('/get_chatters', function(response) {
      $('.chat-info').text("There are currently " + response.length + " people in the chat room");
      chatter_count = response.length; //update chatter count
    });

    $('#join-chat').click(function() {
      var username = $.trim($('#username').val());
      $.ajax({
        url: '/join',
        type: 'POST',
        data: {
            username: username
        },
        success: function(response) {
          if (response.status == 'OK') { //username doesn't already exists
            socket.emit('update_chatter_count', {
              'action': 'increase'
            });
            $('.chat').show();
            $('#leave-chat').data('username', username);
            $('#send-message').data('username', username);
            $.get('/get_messages', function(response) {
              if (response.length > 0) {
                var message_count = response.length;
                var html = '';
                for (var x = 0; x < message_count; x++) {
                  html += "<div class='msg'><div class='user'>" + response[x]['sender'] + "</div><div class='txt'>" + response[x]['message'] + "</div></div>";
                }
                $('.messages').html(html);
              }
            });
            $('.join-chat').hide(); //hide the container for joining the chat room.
          } else if (response.status == 'FAILED') { //username already exists
            alert("Sorry but the username already exists, please choose another one");
            $('#username').val('').focus();
          }
        }
      });
    });

    $('#leave-chat').click(function() {
      var username = $(this).data('username');
      $.ajax({
        url: '/leave',
        type: 'POST',
        dataType: 'json',
        data: {
          username: username
        },
        success: function(response) {
          if (response.status == 'OK') {
            socket.emit('message', {
              'username': username,
              'message': username + " has left the chat room.."
            });
            socket.emit('update_chatter_count', {
              'action': 'decrease'
            });
            $('.chat').hide();
            $('.join-chat').show();
            $('#username').val('');
            alert('You have successfully left the chat room');
          }
        }
      });
    });

    $('#send-message').click(function() {
      var username = $(this).data('username');
      var message = $.trim($('#message').val());
      $.ajax({
        url: '/send_message',
        type: 'POST',
        dataType: 'json',
        data: {
          'username': username,
          'message': message
        },
        success: function(response) {
          if (response.status == 'OK') {
            socket.emit('message', {
              'username': username,
              'message': message
            });
            $('#message').val('');
          }
        }
      });
    });

    socket.on('send', function(data) {
      var username = data.username;
      var message = data.message;
      var html = "<div class='msg'><div class='user'>" + username + "</div><div class='txt'>" + message + "</div></div>";
      $('.messages').append(html);
    });

    socket.on('count_chatters', function(data) {
      if (data.action == 'increase') {
        chatter_count++;
      } else {
        chatter_count--;
      }
      $('.chat-info').text("There are currently " + chatter_count + " people in the chat room");
    });

  }
})
