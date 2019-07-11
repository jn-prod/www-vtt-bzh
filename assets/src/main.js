import Vue from 'vue'
import axios from 'axios'
import EventItem from './components/EventItem.vue.js'

var dateNow = new Date(Date.now())

function dateFormat (date) {
  var day = Number(date.split('/')[0])
  var month = Number(date.split('/')[1]) - 1
  var year = Number(date.split('/')[2])
  return new Date(year, month, day)
}

function getDatas (sliceEnd, callback) {
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
      callback(data.slice(0,sliceEnd))
    })      
}

Vue.component('event-item', EventItem)

var app = new Vue({
  el: '#app',
  data: {
    info: null,
    dataDefaultLength: 0,
    loadMoreButton: false
  },
  methods: {
    updateDatas: function (event) {
      this.dataDefaultLength += 20
      getDatas(this.dataDefaultLength, (datas) => {
        this.info = datas
        if (this.info.length >= this.dataDefaultLength) {
          this.loadMoreButton = true
        } else {
          this.loadMoreButton = false
        }
      })
    }
  }
})

app.updateDatas()