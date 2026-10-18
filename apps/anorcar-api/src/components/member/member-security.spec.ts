import 'reflect-metadata';
import { MemberService } from './member.service';
import { AuthService } from '../auth/auth.service';
import { MemberType, MemberStatus } from '../../libs/enums/member.enum';
import { MemberUpdate } from '../../libs/dto/member/memberr.update';
import { MemberResolver } from './member.resolver';

const id = '507f1f77bcf86cd799439011';
function setup() {
 const auth = new AuthService({ signAsync: jest.fn().mockResolvedValue('fixture-token') } as never);
 const model = {
  create: jest.fn(async (input: object) => ({ _id: id, ...input })),
  findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: id, memberType: MemberType.USER }) }),
 };
 const service = new MemberService(model as never, {} as never, auth, {} as never, {} as never);
 return { model, auth, service };
}
describe('Member role boundaries and password updates', () => {
 it('preserves the validated profile ID through the actual resolver-to-service path', async () => {
  const { service, model } = setup();
  const resolver = new MemberResolver(service, {} as never);
  const input = { _id: id, memberNick: 'fixture' } as MemberUpdate;
  await expect(resolver.updateMember(input, id as never)).resolves.toMatchObject({ _id: id });
  expect(model.findOneAndUpdate.mock.calls[0][0]._id).toBe(id);
  expect(input._id).toBe(id);
 });
 it('refuses public ADMIN signup before writing a record', async () => {
  const { service, model } = setup();
  await expect(service.signup({ memberNick: 'fixture', memberPhone: 'fixture-phone', memberPassword: 'fixture-pass', memberType: MemberType.ADMIN })).rejects.toThrow();
  expect(model.create).not.toHaveBeenCalled();
 });
 it.each([MemberType.USER, MemberType.AGENT])('preserves supported %s registration with a real password hash', async memberType => {
  const { service, model, auth } = setup();
  await service.signup({ memberNick: 'fixture', memberPhone: 'fixture-phone', memberPassword: 'fixture-pass', memberType });
  const stored = model.create.mock.calls[0][0] as { memberPassword: string; memberType: MemberType };
  expect(stored.memberType).toBe(memberType);
  expect(stored.memberPassword).not.toBe('fixture-pass');
  expect(await auth.comparePasswords('fixture-pass', stored.memberPassword)).toBe(true);
 });
 it.each([{ memberType: MemberType.ADMIN }, { memberType: MemberType.AGENT }, { memberStatus: MemberStatus.ACTIVE }, { memberStatus: MemberStatus.DELETE }])('refuses privilege/status fields through self-service profile updates (%j)', async fields => {
  const { service, model } = setup();
  await expect(service.updateMember(id as never, { _id: id, ...fields } as MemberUpdate)).rejects.toThrow();
  expect(model.findOneAndUpdate).not.toHaveBeenCalled();
 });
 it('refuses a different profile ID before writing', async () => {
  const { service, model } = setup();
  await expect(service.updateMember(id as never, { _id: '507f1f77bcf86cd799439022', memberNick: 'fixture' } as MemberUpdate)).rejects.toThrow();
  expect(model.findOneAndUpdate).not.toHaveBeenCalled();
 });
 it('hashes self-service password changes without mutating the input or changing _id', async () => {
  const { service, model, auth } = setup();
  const input = { _id: id, memberPassword: 'fixture-pass', memberFullName: 'Fixture User' } as MemberUpdate;
  await service.updateMember(id as never, input);
  const [search, update] = model.findOneAndUpdate.mock.calls[0];
  expect(search).toEqual({ _id: id, memberStatus: MemberStatus.ACTIVE });
  expect(update._id).toBeUndefined();
  expect(update.memberFullName).toBe('Fixture User');
  expect(await auth.comparePasswords('fixture-pass', update.memberPassword)).toBe(true);
  expect(input.memberPassword).toBe('fixture-pass');
 });
 it('preserves authorized admin role changes while hashing passwords', async () => {
  const { service, model, auth } = setup();
  await service.updateMemberByAdmin({ _id: id, memberType: MemberType.AGENT, memberPassword: 'fixture-pass' } as MemberUpdate);
  const [search, update] = model.findOneAndUpdate.mock.calls[0];
  expect(search).toEqual({ _id: id });
  expect(update.memberType).toBe(MemberType.AGENT);
  expect(update._id).toBeUndefined();
  expect(await auth.comparePasswords('fixture-pass', update.memberPassword)).toBe(true);
 });
 it('does not invent or overwrite a password during ordinary profile edits', async () => {
  const { service, model } = setup();
  await service.updateMember(id as never, { _id: id, memberNick: 'fixture' } as MemberUpdate);
  expect(model.findOneAndUpdate.mock.calls[0][1]).toEqual({ memberNick: 'fixture' });
 });
});
