import { Inject, Injectable } from '@nestjs/common';
import DiscordOauth2 from 'discord-oauth2';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/_.js';
import { InviteCodeEntityService } from '@/core/entities/InviteCodeEntityService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { generateInviteCode } from '@/misc/generate-invite-code.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '../../error.js';

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
			code: {
				type: 'string',
				optional: false, nullable: false,
				example: 'GR6S02ERUA5VR',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		discordToken: { type: 'string' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const oauth = new DiscordOauth2();
			const accessToken = ps.discordToken ?? '';
			const discrdUserGuilds = await oauth.getUserGuilds(accessToken);
			let status = false;
			for (const item of discrdUserGuilds) {
				if (item.id === '782572725969354762') {
					status = true;
					break;
				}
			}
			if (!status) {
				throw new ApiError(meta.errors.notSsMember);
			}

			const ticketsPromises = [];

			for (let i = 0; i < 1; i++) {
				ticketsPromises.push(this.registrationTicketsRepository.insert({
					id: this.idService.gen(),
					expiresAt: null,
					code: generateInviteCode(),
				}).then(x => this.registrationTicketsRepository.findOneByOrFail(x.identifiers[0])));
			}

			const tickets = await Promise.all(ticketsPromises);

			return { code: tickets[0].code };
		});
	}
}
