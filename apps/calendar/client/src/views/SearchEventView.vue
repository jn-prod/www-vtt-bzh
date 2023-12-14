<template>
  <section class="container-fluid">
    <header id="header-wrapper" class="row mb-5">
      <section class="col-md-4 bg-white p-2 m-2 mx-md-5 px-md-5 rounded shadow">
        <!-- value proposition        -->
        <h1 class="h3 text-left m2-5">Rechercher une rando VTT à coté de chez toi n'aura jamais été aussi simple.</h1>

        <!-- search form component -->
        <search-form @submit-search-form="setSearchQuery" @cancel-search-form="cancelSearchQuery"></search-form>
      </section>
    </header>

    <!-- calendar component -->
    <div class="mt-5 mx-md-5">
      <h2 id="calendar" class="mb-5 text-center">
        Calendrier des randonnées à venir
        <span id="nombre_rando" class="badge bg-success">{{ count }}</span>
      </h2>
      <p v-if="isResults" class="alert alert-danger">
        Aucun résultat pour cette recherche, choisissez une autre date de début et de fin.
      </p>

      <!-- Load event -->
      <event-card v-for="event in events" :key="event.id" :event="event" class="my-3"> </event-card>

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

<script lang="js">
import { computed, ref } from 'vue';

import eventService from '@/services/events.service';

// import components
import EventCard from '@/components/EventCard.vue';
import SearchForm from '@/components/SearchForm.vue';

const getDate = (date) => date.toISOString().split('T')[0];

export default {
  name: 'SearchEventView',
  components: {
    EventCard,
    SearchForm,
  },
  setup() {
    const data = ref([]);
    const paginator = ref(20);
    const searchFormQuery = ref(null);
    const baseQuery = { from: `${getDate(new Date())}` };

    (async () => {
      const { data: events } = await eventService.fetchSearch(baseQuery);
      data.value = events;
    })();

    const setPaginator = (inc = 20) => {
      paginator.value += inc;
    };

    const setSearchQuery = async ({ dpt, endDate, startDate }) => {
      if (!dpt && !endDate && !startDate) return;

      searchFormQuery.value = {
        where: dpt === 'all' ? undefined : dpt,
        from: getDate(startDate),
        to: getDate(endDate),
      };

      const { data: events } = await eventService.fetchSearch(searchFormQuery.value);
      data.value = events;
    };

    const cancelSearchQuery = async ({ cancel }) => {
      if (!cancel) return;

      searchFormQuery.value = baseQuery;
      const { data: events } = await eventService.fetchSearch(baseQuery);
      data.value = events;
    };

    const isLoadMoreActive = computed(() => (data.value || []).length > (paginator.value || 0));

    const events = computed(() => (data.value || []).slice(0, paginator.value));

    const isResults = computed(() => data.value?.length < 1);

    const count = computed(() => data?.value?.length || 0);

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
