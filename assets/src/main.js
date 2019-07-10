import Vue from 'vue'
import axios from 'axios'
import EventItem from './components/EventItem.vue.js'

var dateNow = new Date(Date.now())

function dateFormat(date) {
  var day = Number(date.split('/')[0])
  var month = Number(date.split('/')[1]) - 1
  var year = Number(date.split('/')[2])
  return new Date(year, month, day)
}

Vue.component('event-item', EventItem)

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