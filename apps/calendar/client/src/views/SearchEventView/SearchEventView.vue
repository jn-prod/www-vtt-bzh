<template>
  <section class="container-fluid">
    <!-- calendar component -->
    <div class="mt-5 mx-md-5">
      <h1 id="calendar" class="mb-5 text-center">
        Calendrier
      </h1>

      <!-- search form component -->
      <search-form @submit-search-form="setSearchQuery" @cancel-search-form="cancelSearchQuery"></search-form>

      <p v-if="!isResults && !isLoading" class="alert alert-danger" aria-live="polite" :aria-busy="isLoading">
        Aucun résultat pour cette recherche, choisissez une autre date de début et de fin.
      </p>
      <p v-if="isResults && !isLoading" class="alert alert-info" aria-live="polite" :aria-busy="isLoading">
        {{ count }} randonnées à découvrir.
      </p>
      <p v-if="isLoading" class="alert alert-info" aria-live="polite" :aria-busy="isLoading">Chargement en cours.</p>

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
    const isLoading = ref(true);
    const baseQuery = { from: `${getDate(new Date())}` };

    const search = async (query) => {
      isLoading.value = true;
      try {
        data.value = await eventService.fetchSearch(query);
      } catch (err) {
        console.error(err);
      }
      isLoading.value = false;
    };

    (async () => {
      await search(baseQuery);
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

      await search(searchFormQuery.value);
    };

    const cancelSearchQuery = async ({ cancel }) => {
      if (!cancel) return;

      searchFormQuery.value = baseQuery;
      await search(baseQuery);
    };

    const count = computed(() => data?.value?.length || 0);

    const isLoadMoreActive = computed(() => count.value > (paginator.value || 0));

    const events = computed(() => (data.value || []).slice(0, paginator.value));

    const isResults = computed(() => count.value > 0);

    return {
      setSearchQuery,
      cancelSearchQuery,
      setPaginator,
      isLoadMoreActive,
      events,
      count,
      isResults,
      isLoading,
    };
  },
};
</script>
