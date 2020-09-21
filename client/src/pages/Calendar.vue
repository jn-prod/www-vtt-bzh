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

          <!-- ads slot -->
          <ads-card
          :ad="ad"
          v-for="(ad, index) in ads"
          :key="index"
          ></ads-card>

          <!-- Load event -->
          <event-card
            v-for="event in events"
            :key="event.id"
            :event="event"
          >
          </event-card>

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
import moment from 'moment';

// import components
import EventCard from '../components/EventCard.vue';
import SearchForm from '../components/SearchForm.vue';
import AdsCard from '../components/AdsCard.vue';

import { dateFormat, dateNow } from '../utils/date';

const activeWeekNum = moment().week();
const year = moment().year();

export default {
  components: {
    EventCard,
    SearchForm,
    AdsCard,
  },
  data() {
    return {
      cache: {
        events: [],
      },
      ads: [{
        title: 'Mettez en avant votre épreuve',
        description: 'Réserver cet espace pour faire la promotion votre randonnée au meilleur emplacement. Avec un contenu original et dynamique (photos, video, ...)',
        img: '',
        href: '/advertize/terms.html',
        default: true,
        active: true,
      }],
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

    // set ads
    axios.get('api/ads.json').then((response) => {
      const { data, status } = response;
      if (!data && status !== 200) return;
      // eslint-disable-next-line max-len
      const activeAds = response.data.filter((val) => Number(val.weekNum) >= activeWeekNum && Number(val.year) >= year);
      if (!activeAds.length) return;
      this.ads = activeAds;
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
      console.log(endDate);
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
