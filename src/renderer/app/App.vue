<script setup>
	import { inject, ref } from 'vue';

	const props = defineProps({
		config: {
			type: Object,
			required: true,
		}
	});
	const debug = inject('debug');

	const buttonClasses = "block mx-auto rounded bg-amber-600 my-8 text-xl px-8 py-2 text-white border-white border-2";

	const ipAddress = ref('');

	const launchServer = () => {
		console.log(props.config);
	}

	const connectToServer = () => {
		debug.log(ipAddress.value);
	}
	
</script>

<template>
	<div class="text-sm text-slate-400 bg-amber-900 text-center py-12 mx-auto h-screen">
		<button :class="buttonClasses" @click="launchServer">Launch Server</button>
		<div>
			<button :class="buttonClasses" class="mt-12" @click="connectToServer">Connect to server</button>
			<input v-model="ipAddress" class="text-xl py-2 px-12 black font-bold" type="text">
		</div>
	</div>
</template>

<style>
	@import './styles/main.css';
</style>
