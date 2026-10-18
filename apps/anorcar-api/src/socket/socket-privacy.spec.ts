import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MemberType } from '../libs/enums/member.enum';

describe('Shared chat preserves messages without broadcasting private member claims', () => {
 afterEach(() => jest.restoreAllMocks());
 it('sends only public identity in join, message, history and leave events; logs contain no message text', async () => {
  const verbose = jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);
  const member = { _id: '507f1f77bcf86cd799439011', memberNick: 'Fixture', memberImage: 'uploads/member/fixture.jpg', memberType: MemberType.AGENT,
   memberPhone: 'private-phone-sentinel', memberAddress: 'private-address-sentinel', memberPassword: 'private-password-sentinel', accessToken: 'private-token-sentinel',
   iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 900 };
  const verifyToken = jest.fn().mockResolvedValue(member);
  const gateway = new SocketGateway({ verifyToken } as never);
  const client = { readyState: 1, send: jest.fn() }, other = { readyState: 1, send: jest.fn() };
  gateway.server = { clients: new Set([client, other]) } as never;
  await gateway.handleConnection(client as never, { url: '/?token=fixture-token' } as never);
  await gateway.handleMessage(client as never, 'private-message-sentinel');
  gateway.handleDisconnect(client as never);
  const events = [...client.send.mock.calls, ...other.send.mock.calls].map(([raw]) => JSON.parse(raw));
  const message = events.find(event => event.event === 'message');
  expect(message.text).toBe('private-message-sentinel');
  expect(message.memberData).toEqual({ _id: member._id, memberNick: member.memberNick, memberImage: member.memberImage, memberType: member.memberType });
  const serialized = JSON.stringify(events);
  for (const secret of ['private-phone-sentinel', 'private-address-sentinel', 'private-password-sentinel', 'private-token-sentinel']) expect(serialized).not.toContain(secret);
  expect(JSON.stringify(verbose.mock.calls)).not.toContain('private-message-sentinel');
  expect(events.some(event => event.event === 'getMessages')).toBe(true);
 });
 it('retains anonymous guest chat and rejects ambiguous duplicate token parameters', async () => {
  jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);
  const verifyToken = jest.fn();
  const gateway = new SocketGateway({ verifyToken } as never);
  const client = { readyState: 1, send: jest.fn() };
  gateway.server = { clients: new Set([client]) } as never;
  await gateway.handleConnection(client as never, { url: '/?token=one&token=two' } as never);
  await gateway.handleMessage(client as never, 'Guest fixture');
  expect(verifyToken).not.toHaveBeenCalled();
  expect(client.send.mock.calls.map(([raw]) => JSON.parse(raw)).find(event => event.event === 'message').memberData).toBeNull();
 });
});
