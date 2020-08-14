<template>
  <article
    class="col-12 p-0 mt-3"
    v-if="isActive">
    <div class="row">
      <div class="col-sm-3">
        <img :src="ad.img" :alt="ad.title" v-if="ad.img" class="img-fluid">
      </div>
      <div class="col-sm-9 bg-light rounded border border-warning shadow py-2 px-5">
        <h3 class="h5">{{ad.title}}</h3>
        <p v-if="ad.description">{{ad.description}}</p>
        <a
          :href="ad.href"
          class="
          btn btn-outline-dark border-bottom-2 rounded-0 border-top-0 border-right-0 border-left-0"
          v-if="ad.href"
        >
          En savoir plus →
        </a>
      </div>
    </div>
  </article>
</template>
<script>

export default {
  props: ['ad'],
  data() {
    return {};
  },
  computed: {
    isActive() {
      // TODO: add start and end date range
      return this.ad.default || this.ad.active;
    },
  },
};
</script>
