export default {
  props: ['event'],
  data() {
    return {
      active: false,
    }
  },
  filters: {
    dateFormat: function (val) {
      var day = val.split('/')[0]
      var year = val.split('/')[2]
      var month = Number(val.split('/')[1])
      if (month === 1) {
        month = 'Jan.'
      } else if (month === 2) {
        month ='Fév.'
      } else if (month === 3) {
        month = 'Mars'
      } else if (month === 4) {
       month = 'Avr.'
      } else if (month === 5) {
       month = 'Mai'
      } else if (month === 6) {
       month = 'Juin'
      } else if (month === 7) {
       month = 'Juil.'
      } else if (month === 8) {
       month = 'Aou.'
      } else if (month === 9) {
       month = 'Sep.'
      } else if (month === 10) {
       month = 'Oct.'
      } else if (month === 11) {
       month = 'Nov.'
      } else if (month === 12) {
       month = 'Déc.'
      }
      return day + ' ' + month + ' ' + year
    }
  },
  template: '<div class="col-12 rounded border border-muted p-2" @click.prevent="active = !active">' +
              '<div class="row">' +
                '<div class="col-12">' +
                  '<div class="row text-bold">' +
                    '<div class="col-sm-2 mt-2 my-auto">' +
                      '<span class="d-block"><i class="far fa-calendar mr-2" aria-hidden="true"></i>{{ event.date | dateFormat }}</span>' +
                    '</div>' +
                    '<div class="col-sm-2 mt-2 my-auto">' +
                      '<span class="d-block my-auto"><i class="fa fa-map-marker-alt mr-2" aria-hidden="true"></i>{{ event.departement }}  - {{ event.city }} </span>' +
                    '</div>' +
                    '<div class="col-sm-7 my-auto">' +
                      '<p class="event-name text-primary mt-2 text-uppercase">{{ event.name }}</p>' +
                    '</div>' +
                    '<div class="col-sm-1 read-more my-auto">' +
                      '<i class="fas fa-chevron-circle-right"></i>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="" v-show="active">' +
                '<div class="row text-left">' +
                  '<div class="col-12 mt-2 pt-2 bg-light">' +
                    '<span class="d-block"><p>Description :</p></span>' +
                    '<span class="d-block"><p>{{event.description}}</p></span>' +
                  '</div>' +
                '</div>' +
                '<div class="row">' +
                  '<div class="col-12 mt-2">' +
                    '<span class="d-inline-block m-2 bg-light shadow rounded p-2">Horaires : {{event.horaire}}</span>' +
                    '<span class="d-inline-block m-2 bg-light shadow rounded p-2">Département : {{event.departement}}</span>' +
                    '<span class="d-inline-block m-2 bg-light shadow rounded p-2">Lieu de rendez-vous : {{event.lieuRdv}}</span>' +
                    '<span class="d-inline-block m-2 bg-light shadow rounded p-2">Organisateur : {{event.organisateur}}</span>' +
                    '<span class="d-inline-block m-2 bg-light shadow rounded p-2">Contact : {{event.contact}}</span>' +
                    '<span class="d-inline-block m-2 bg-light shadow rounded p-2">Prix Club : {{event.prixClub}}</span>' +
                    // <span class="d-block"><p> Prix Public : ' + prixPublic + '</p></span>
                  '</div> ' +       
                '</div>' +
              '</div>' +
            '</div>'
}
