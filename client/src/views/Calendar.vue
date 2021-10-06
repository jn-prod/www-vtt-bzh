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

          <div class="my-5">
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
  </div>
</template>

<script>
import { computed, ref } from 'vue';

import eventService from '@/services/event-service';

// import components
import EventCard from '@/components/EventCard.vue';
import SearchForm from '@/components/SearchForm.vue';

import { dateFormat } from '@/utils/date';

export default {
  name: 'Calendar',
  components: {
    EventCard,
    SearchForm,
  },
  setup() {
    const data = ref([]);
    const paginator = ref(20);
    const searchFormQuery = ref(null);

    const getEvents = async () => {
      data.value = await eventService.getEvents();
    };

    getEvents();

    const setPaginator = (inc = 20) => {
      paginator.value += inc;
    };

    const setSearchQuery = async ({ dpt, endDate, startDate }) => {
      searchFormQuery.value = {
        dpt,
        endDate,
        startDate,
      };

      if (!dpt && !endDate && !startDate) return;

      const cacheEvents = await eventService.getEvents();

      data.value = cacheEvents.filter((event) => {
        const eventDate = dateFormat(event.date);
        const dateFilter = (eventDate >= startDate) && (eventDate <= endDate);
        const dptFilter = dpt === 'all' ? true
          : Number(event.departement) === Number(dpt);

        return dateFilter && dptFilter;
      });
    };

    const cancelSearchQuery = async ({ cancel }) => {
      if (!cancel) return;

      searchFormQuery.value = null;
      data.value = await eventService.getEvents();
    };

    const isLoadMoreActive = computed(() => (data.value || []).length > (paginator.value || 0));

    const events = computed(() => (data.value || []).slice(0, paginator.value));

    const isResults = computed(() => data.value.length < 1);

    return {
      setSearchQuery,
      cancelSearchQuery,
      setPaginator,
      isLoadMoreActive,
      events,
      isResults,
    };
  },
};

</script>
