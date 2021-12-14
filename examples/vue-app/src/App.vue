<template>
  <!-- <HelloWorld/> -->
  <HelloWorld2/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import HelloWorld2 from './components/Helloworld2.vue';

export default defineComponent({
  name: 'App',
  components: {
    // HelloWorld,
    HelloWorld2
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
