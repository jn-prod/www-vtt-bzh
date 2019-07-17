export default {
  template: '<button v-on:click.prevent="$parent.dataDefaultLength += 20" v-show="$parent.loadMoreButton" class="btn btn-primary">Voir +</button>'
}