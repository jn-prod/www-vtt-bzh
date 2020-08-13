<template>
  <div class="row">
    <div class="col-12">
      <Calendar></Calendar>
    </div>
  </div>
</template>

<script>
// import pages
import Calendar from './pages/Calendar.vue';

export default {
  name: 'App',
  components: {
    Calendar,
  },
};
</script>

<style>
</style>
