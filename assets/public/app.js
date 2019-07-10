var dateNow = new Date(Date.now())

function dateFormat(date) {
  var day = Number(date.split('/')[0])
  var month = Number(date.split('/')[1]) - 1
  var year = Number(date.split('/')[2])
  return new Date(year, month, day)
}

Vue.component('event-item', {
  template: '<li>This is a todo</li>',
  props: ['event'],
  data() {
    return {
      active: false,
    }
  },
  template: '<div class="row" @click.prevent="active = !active">' +
              '<div class="col-12">' +
                '<div class="row">' +
                  '<div class="col-sm-12">' +
                    '<div class="row text-bold">' +
                      '<div class="col-sm-2 mt-2">' +
                        '<span class="d-block"><i class="far fa-calendar" aria-hidden="true"></i>{{ event.date }}</span>' +
                      '</div>' +
                      '<div class="col-sm-2 mt-2">' +
                        '<span class="d-block"><i class="fa fa-map-marker-alt" aria-hidden="true"></i>{{ event.departement }}  - {{ event.city }} </span>' +
                      '</div>' +
                      '<div class="col-sm-7">' +
                        '<p class="event-name text-primary mt-2 text-uppercase">{{ event.name }}</p>' +
                      '</div>' +
                      '<div class="col-sm-1 read-more">' +
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
              '</div>' +
            '</div>'
})

new Vue({
  el: '#app',
  data () {
    return {
      info: null
    }
  },
  mounted () {
    axios
      .get('https://vtt.bzh/events.json')
      .then((response) => {
        var data = response.data

        // get only next events
        data = data.filter((val) => {
          return dateFormat(val.date) >= dateNow
        })

        // sort by dates
        data.sort((a, b) => {
          return dateFormat(a.date) - dateFormat(b.date)
        })
          
        // set info value
        this.info = data
      })
  }
})