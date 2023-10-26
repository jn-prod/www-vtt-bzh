<template>
  <section class="container-fluid">
    <header id="header-wrapper" class="row mb-5">
      <section class="col-md-4 bg-white p-2 m-2 mx-md-5 px-md-5 rounded shadow">
        <!-- value proposition        -->
        <h1 class="h3 text-left m2-5">
          Rechercher une rando VTT à coté de chez toi n'aura jamais été aussi
          simple.
        </h1>

        <!-- search form component -->
        <search-form
          @submit-search-form="setSearchQuery"
          @cancel-search-form="cancelSearchQuery"
        ></search-form>
      </section>
    </header>

    <!-- calendar component -->
    <div class="mt-5 mx-md-5">
      <h2 id="calendar" class="mb-5 text-center">
        Calendrier des randonnées à venir
        <span id="nombre_rando" class="badge bg-success">{{ count }}</span>
      </h2>
      <p v-if="isResults" class="alert alert-danger">
        Aucun résultat pour cette recherche, choisissez une autre date de début
        et de fin.
      </p>

      <!-- Load event -->
      <event-card
        v-for="event in events"
        :key="event.id"
        :event="event"
        class="my-3"
      >
      </event-card>

      <!-- load-more button -->
      <div class="text-center mt-3">
        <button
          v-show="isLoadMoreActive"
          class="btn btn-secondary shadow mt-3 px-5 rounded-pill"
          @click.prevent="setPaginator()"
        >
          Voir +
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import { computed, ref } from 'vue';
import { cloneDeep } from 'lodash';

import eventService from '@/services/events';

// import components
import EventCard from '@/components/EventCard.vue';
import SearchForm from '@/components/SearchForm.vue';

const getDate = (date) => date.toISOString().split('T')[0];

export default {
  name: 'CalendarView',
  components: {
    EventCard,
    SearchForm,
  },
  setup() {
    const data = ref([]);
    const paginator = ref(20);
    const searchFormQuery = ref(null);
    const projection =
      'date.place.name.contact.price.canceled.departement.hour.organisateur.city.description';
    const filter = { fromDate: `${getDate(new Date())}` };
    const sort = { date: 1 };
    const baseQuery = { projection, filter, sort };

    const getEvents = async () => {
      data.value = await eventService.getEvents(baseQuery);
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

      const searchQuery = cloneDeep(baseQuery);

      searchQuery.filter.fromDate = getDate(startDate);
      searchQuery.filter.toDate = getDate(endDate);
      searchQuery.filter.departement = dpt === 'all' ? undefined : dpt;

      data.value = await eventService.getEvents(searchQuery);
    };

    const cancelSearchQuery = async ({ cancel }) => {
      if (!cancel) return;

      searchFormQuery.value = null;
      data.value = await eventService.getEvents(baseQuery);
    };

    const isLoadMoreActive = computed(
      () => (data.value || []).length > (paginator.value || 0),
    );

    const events = computed(() => (data.value || []).slice(0, paginator.value));

    const isResults = computed(() => data.value.length < 1);

    const count = computed(() => data?.value.length || 0);

    return {
      setSearchQuery,
      cancelSearchQuery,
      setPaginator,
      isLoadMoreActive,
      events,
      count,
      isResults,
    };
  },
};
</script>
