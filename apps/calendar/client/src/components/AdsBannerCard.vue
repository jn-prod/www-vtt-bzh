<script lang="tsx">
export default {
  name: 'AdsBannerCard',
  computed: {
    ads() {
      const advertize = window.localStorage.getItem('vtt_bzh_ads') || '';
      return JSON.parse(advertize);
    },
  },
  render() {
    return this.ads.banner.active ? (
      <div class="text-center my-3">
        <a href={this.ads.banner.url} target="_blank">
          <img src={this.ads.banner.img} alt={`publicité: ${this.ads.banner.title}`} class="img-fluid" />
        </a>
      </div>
    ) : (
      <div hidden></div>
    );
  },
};
</script>
