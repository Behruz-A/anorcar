import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import { Member } from '../libs/dto/member/member';
import { AuthService } from '../components/auth/auth.service';

type ChatMember = Pick<Member, '_id' | 'memberNick' | 'memberImage' | 'memberType'>;

interface MessagePayload {
	event: string;
	text: string;
	memberData: ChatMember | null;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: ChatMember | null;
	action: string;
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketEventsGateway');
	private summaryClient: number = 0;
	private clientsAuthMap = new Map<WebSocket, Member | null>();
	private messagesList: MessagePayload[] = [];

	constructor(private authService: AuthService) {}

	@WebSocketServer()
	server!: Server;

	public afterInit(_server: Server) {
		this.logger.verbose(`WebSocket Server Initialized & total [${this.summaryClient}]`);
	}

	private async retrieveAuth(req: IncomingMessage): Promise<Member | null> {
		try {
			const tokens = new URL(req.url || '/', 'http://localhost').searchParams.getAll('token');
			if (tokens.length !== 1) return null;
			const token = tokens[0];
			const normalizedToken = token.trim().replace(/^Bearer\s+/i, '');
			if (!normalizedToken) return null;

			return await this.authService.verifyToken(normalizedToken);
		} catch (err) {
			this.logger.warn('WebSocket authentication failed');
			return null;
		}
	}

	public async handleConnection(client: WebSocket, req: IncomingMessage) {
		const authMember = await this.retrieveAuth(req);
		this.summaryClient++;
		this.clientsAuthMap.set(client, authMember);

		const clientNick = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connection [${clientNick}] & total [${this.summaryClient}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: this.chatMember(authMember),
			action: 'joined',
		};
		this.emitMessage(infoMsg);
	}

	public handleDisconnect(client: WebSocket) {
		const authMember = this.clientsAuthMap.get(client) ?? null;
		this.summaryClient--;
		this.clientsAuthMap.delete(client);

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Disconnection [${clientNick}] & total [${this.summaryClient}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: this.chatMember(authMember),
			action: 'left',
		};
		this.broadcastMessage(client, infoMsg);
	}

	@SubscribeMessage('message')
	public async handleMessage(client: WebSocket, payload: string): Promise<void> {
		const cachedMember = this.clientsAuthMap.get(client) as (Member & { exp?: number; iat?: number }) | null | undefined;
		const now = Date.now() / 1000;
		const expired = cachedMember && ((cachedMember.exp ?? 0) <= now || (cachedMember.iat ?? 0) + 900 <= now);
		const authMember = expired ? null : cachedMember ?? null;
		if (expired) this.clientsAuthMap.set(client, null);
		const newMessage: MessagePayload = { event: 'message', text: payload, memberData: this.chatMember(authMember) };

		this.logger.verbose('WebSocket message received');

		this.messagesList.push(newMessage);
		if (this.messagesList.length > 5) this.messagesList.splice(0, this.messagesList.length - 5);

		this.emitMessage(newMessage);
		//client messages
		client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList }));
	}

	private chatMember(member: Member | null): ChatMember | null {
		if (!member) return null;
		return { _id: member._id, memberNick: member.memberNick, memberImage: member.memberImage, memberType: member.memberType };
	}

	private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client !== sender && client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	private emitMessage(message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}
}

/**
 * Message Target:
 * 1-Client(only client)
 * 2-Broadcast (except client)
 * 3- Emit ( all Cinet)
 *
 */
