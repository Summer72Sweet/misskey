import { Inject, Injectable } from '@nestjs/common';
import DiscordOauth2 from 'discord-oauth2';
import type { Config } from '@/config.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/_.js';
import { InviteCodeEntityService } from '@/core/entities/InviteCodeEntityService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	requireCredential: false,

	errors: {
		notSsMember: {
			message: 'The user is not a member of SummerSweet!',
			code: 'NOT_SS_MEMBER',
			id: '4d163e30-7ce3-a7a4-723c-fba15be9af80',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			access_token: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		code: { type: 'string' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const oauth = new DiscordOauth2();
			const code = ps.code ?? '';
			console.log(this.config.discord);
			console.log(code);
			const token = await oauth.tokenRequest({
				clientId: this.config.discord.id,
				clientSecret: this.config.discord.secret,
				code: code,
				scope: 'guilds',
				grantType: 'authorization_code',
				redirectUri: this.config.discord.redirectUri,
			});

			return { access_token: token.access_token };
		});
	}
}
