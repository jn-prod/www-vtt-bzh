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

function sliceDatas (datas, slicer) {
  return datas.slice(0,slicer)
}

Vue.component('event-item', EventItem)

Vue.component('load-more-button', {
  template: '<button v-on:click.prevent="$parent.dataDefaultLength += 20" v-show="$parent.loadMoreButton" class="btn btn-primary">Voir +</button>'
})

var app = new Vue({
  el: '#app',
  data () {
    return {
      datas: null,
      dataDefaultLength: 0,
      searchForm: null,
      loadMoreButton: false      
    }
  },
  mounted () {
    axios
      .get('https://vtt.bzh/events.json')
      .then((json) => {
        // get only next events
        var response = json.data.filter((val) => {
          return dateFormat(val.date) >= dateNow
        })

        // sort by dates
        response.sort((a, b) => {
          return dateFormat(a.date) - dateFormat(b.date)
        })
        this.datas = response
      }) 
  },
  methods: {
  },
  computed: {
    loadDatas: function () {
      this.dataDefaultLength += 20
      if (this.datas) {
        this.loadMoreButton = this.datas.length >= this.dataDefaultLength
        return sliceDatas(this.datas,this.dataDefaultLength)  
      }
    }
  }
})
