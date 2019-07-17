import Vue from 'vue'
import axios from 'axios'

// import components
import EventItem from './components/EventItem.vue.js'
import LoadMoreButton from './components/LoadMoreButton.vue.js'
import SearchForm from './components/SearchForm.vue.js'

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

// components
Vue.component('event-item', EventItem)
Vue.component('load-more-button', LoadMoreButton)
Vue.component('search-form', SearchForm)

// application
var app = new Vue({
  el: '#app',
  data () {
    return {
      datas: null,
      dataDefaultLength: 20,
      searchForm: null,
      searchResult: [],
      loadMoreButton: false,
      displayNoResults: false
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
    startSearch: function (value) {
      // initialize query
      this.searchForm = {}
      this.displayNoResults = false
      // setup query
      this.searchForm.startDate = new Date(value.startDate)
      this.searchForm.endDate = new Date(value.endDate)
      this.searchForm.dpt = value.dpt
      var query = this.searchForm

      var result = this.datas.filter(function (data) {
        var dateFilter = dateFormat(data.date) >= query.startDate && dateFormat(data.date) <= query.endDate
        var dptFilter
        if (query.dpt !== "all") {
          dptFilter = Number(data.departement) === Number(query.dpt)
        } else {
          dptFilter = true
        }
        return dateFilter && dptFilter
      })

      if (result.length === 0) {
        this.displayNoResults = true
      }

      this.searchResult = result
    },
  },
  computed: {
    loadDatas: function () {
      if (this.datas) {
        if (this.searchResult.length > 0) {
          this.loadMoreButton = false
          return this.searchResult
        } else {
          this.loadMoreButton = this.datas.length >= this.dataDefaultLength
          return sliceDatas(this.datas,this.dataDefaultLength)
        }
      }
    }
  }
})
