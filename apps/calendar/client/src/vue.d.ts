declare module '*.vue' {
  import { DefineComponent } from 'vue';
  export * from 'vue';
  const component: DefineComponent;
  export default component;
}
