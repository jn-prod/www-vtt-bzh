<template>
  <div>
    <div class="row" id="header-wrapper">
      <div class="col-md-4 bg-white p-2 p-md-5 m-2 m-md-5 rounded shadow">
        <section>

          <!-- value proposition        -->
          <h1 class="h3 text-left my-5">
            Rechercher une rando VTT à coté de chez toi n'aura jamais été aussi simple.
          </h1>

          <!-- search form component -->
          <search-form
            @submit-search-form="setSearchQuery"
            @cancel-search-form="cancelSearchQuery"
          ></search-form>

        </section>
      </div>
    </div>

    <!-- calendar component -->
    <div class="row">
      <div class="col-12">
        <div class="container">
          <div class="row">
            <div class="col-12 mt-5 mb-3">
              <h2 id="calendar">Calendrier des randonnées à venir</h2>
              <span id="nombre_rando" class="badge badge-success"></span>
            </div>
          </div>

          <div class="row" v-if="isResults">
            <div class="col-12">
              <div class="alert alert-danger">
                Aucun résultat pour cette recherche, choisissez une autre date de début et de fin.
              </div>
            </div>
          </div>

          <!-- <md-progress-circular md-mode="indeterminate" ng-show="$ctrl.isLoading"
          class="mx-auto my-5 d-block text-center"></md-progress-circular> -->

          <!-- Load event -->
          <ul>
            <event-card
              v-for="event in events"
              :key="event.id"
              v-bind:event="event"
            >
            </event-card>
          </ul>

          <!-- load-more button -->
          <div class="row">
            <div class="col-12 text-center mt-3">
              <button
                v-on:click.prevent="setPaginator()"
                v-show="isLoadMoreActive"
                class="btn btn-secondary shadow mt-3 px-5 rounded-pill">
                  Voir +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
// import components
import EventCard from '../components/EventCard.vue';
import SearchForm from '../components/SearchForm.vue';

import { dateFormat, dateNow } from '../utils/date';

export default {
  components: {
    EventCard,
    SearchForm,
  },
  data() {
    return {
      cache: {
        events: [],
      },
      eventsDatas: [],
      paginator: 20,
      searchFormQuery: null,
    };
  },
  mounted() {
    // set only next events
    axios.get('api/events.json').then((response) => {
      const { data, status } = response;
      if (!data && status !== 200) return;
      this.cache.events = response.data.filter((val) => {
        if (!val.date) return false;
        return dateFormat(val.date) >= dateNow;
      }).sort((a, b) => dateFormat(a.date) - dateFormat(b.date));
      this.eventsDatas = [...this.cache.events];
    });
  },
  computed: {
    isLoadMoreActive() {
      if (!this.eventsDatas || !this.paginator) {
        return false;
      }
      return this.eventsDatas.length > this.paginator;
    },
    isResults() {
      return this.eventsDatas.length < 1;
    },
    events() {
      if (!this.eventsDatas || !this.paginator) return [];
      // paginate events datas
      const events = [...this.eventsDatas];
      return events.slice(0, this.paginator);
    },
  },
  methods: {
    setPaginator() {
      this.paginator += 20;
    },
    setSearchQuery({ dpt, endDate, startDate }) {
      this.searchFormQuery = {
        dpt,
        endDate,
        startDate,
      };
      if (!dpt && !endDate && !startDate) return;
      this.eventsDatas = this.cache.events.filter((data) => {
        const eventDate = dateFormat(data.date);
        const dateFilter = (eventDate >= startDate) && (eventDate <= endDate);
        let dptFilter;

        if (dpt !== 'all') {
          dptFilter = Number(data.departement) === Number(dpt);
        } else {
          dptFilter = true;
        }

        return dateFilter && dptFilter;
      });
    },
    cancelSearchQuery({ cancel }) {
      if (!cancel) return;

      this.searchFormQuery = null;
      this.eventsDatas = [...this.cache.events];
    },
  },
};

</script>
