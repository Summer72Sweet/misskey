<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance">
	<XSetup v-if="instance.requireSetup"/>
	<XEntranceClassic v-else-if="(instance.clientOptions.entrancePageStyle ?? 'classic') === 'classic'"/>
	<XEntranceSimple v-else/>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { instanceName } from '@@/js/config.js';
import XSetup from './welcome.setup.vue';
import XEntranceClassic from './welcome.entrance.classic.vue';
import XEntranceSimple from './welcome.entrance.simple.vue';
import { definePage } from '@/page.js';
import { fetchInstance } from '@/instance.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import XSignupDialog from '@/components/MkSignupDialog.vue';
import { useRouter } from '@/router.js';
const router = useRouter();

const instance = ref<Misskey.entities.MetaDetailed | null>(null);

fetchInstance(true).then((res) => {
	instance.value = res;
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: instanceName,
	icon: null,
}));

try {
	let code: string = (new URL(`https://msky.summersweet.jp${router.currentFullPath}`)).searchParams.get('code') ?? '';

	const accessToken = await misskeyApi('discord/token', {
		code: code,
	});
	const ticket = await misskeyApi('discord/check', {
		discordToken: accessToken.access_token,
	});
	os.popup(XSignupDialog, {
		autoSet: true,
		code: ticket.code,
	}, {}, 'closed');
} catch { /* empty */ }
</script>
