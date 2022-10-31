<script setup lang="ts"> //eslint-disable-line

const serverUrl = ``;

const buttonClasses = "block mx-auto rounded bg-amber-600 my-8 text-xl px-8 py-2 text-white border-white border-2";

const launchServer = () => {
  console.log('Launch...');
}
  
</script>

<template>
  <div class="text-sm text-slate-400 bg-amber-900 text-center py-12 mx-auto">
    <button :class="buttonClasses" @click="launchServer">Launch Server</button>
    <form action="">
      <button :class="buttonClasses" class="mt-12">Connect to server</button>
      <input class="text-xl py-2 px-12 black font-bold" type="text" value="" :v-model="serverUrl">
    </form>
  </div>
</template>

<style>
  @import './styles/main.css';
</style>
