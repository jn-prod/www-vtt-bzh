<template>
    <div class="text-center my-3" v-if="ads.banner">
        <a :href="ads.banner.url" target="_blank">
            <img :src="ads.banner.img" :alt="`publicité: ${ads.banner.title}`" class="img-fluid">
        </a>
    </div>
</template>

<script>
export default {
  name: 'AdsBannerCard',
  computed: {
    ads() {
      const advertize = window.localStorage.getItem('vtt_bzh_ads') || '';
      return JSON.parse(advertize);
    },
  },
};
</script>
