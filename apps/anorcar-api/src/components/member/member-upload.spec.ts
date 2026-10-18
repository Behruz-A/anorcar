import 'reflect-metadata';
import { Readable, Writable } from 'stream';
import { createWriteStream } from 'fs';
import { MemberResolver } from './member.resolver';

jest.mock('fs', () => ({ ...jest.requireActual('fs'), createWriteStream: jest.fn() }));
const file = (filename = 'photo.jpg', mimetype = 'image/jpeg') => ({
 filename, mimetype, encoding: '7bit', createReadStream: jest.fn(() => Readable.from(Buffer.from('fixture-image'))),
});
describe('Authenticated image store validation and stream handling', () => {
 let resolver: MemberResolver;
 beforeEach(() => {
  resolver = new MemberResolver({} as never, {} as never);
  (createWriteStream as jest.Mock).mockReset().mockImplementation(() => new Writable({ write(_chunk, _encoding, done) { done(); } }));
 });
 it.each(['../..', '../member', '/tmp', 'car/../../', 'uploads/car', '', 'CAR'])('rejects target %s before opening any output stream', async target => {
  const upload = file();
  await expect(resolver.imageUploader(Promise.resolve(upload), target)).rejects.toThrow();
  await expect(resolver.imagesUploader([Promise.resolve(upload)], target)).rejects.toThrow();
  expect(createWriteStream).not.toHaveBeenCalled();
  expect(upload.createReadStream).not.toHaveBeenCalled();
 });
 it.each(['member', 'car', 'article'])('keeps the existing %s upload contract with normalized extensions', async target => {
  const upload = file('Original Camera Name.JPG');
  const result = await resolver.imageUploader(Promise.resolve(upload), target);
  expect(result).toMatch(new RegExp('^uploads/' + target + '/[a-f0-9-]+\\.jpg$'));
  expect(createWriteStream).toHaveBeenCalledWith(result, { flags: 'wx' });
  expect(upload.createReadStream).toHaveBeenCalledTimes(1);
 });
 it.each([['file.html', 'image/jpeg'], ['file.svg', 'image/png'], ['photo.jpg', 'text/html'], ['photo', 'image/jpeg']])('rejects incompatible filename/MIME pairs %s / %s', async (filename, mimetype) => {
  await expect(resolver.imageUploader(Promise.resolve(file(filename, mimetype)), 'article')).rejects.toThrow();
  expect(createWriteStream).not.toHaveBeenCalled();
 });
 it('supports octet-stream only for the allowed raster extensions', async () => {
  await expect(resolver.imageUploader(Promise.resolve(file('photo.png', 'application/octet-stream')), 'member')).resolves.toMatch(/\.png$/);
  await expect(resolver.imageUploader(Promise.resolve(file('file.html', 'application/octet-stream')), 'member')).rejects.toThrow();
 });
 it('surfaces a failed batch instead of returning a sparse partial-success array', async () => {
  await expect(resolver.imagesUploader([Promise.resolve(file()), Promise.resolve(file('payload.html'))], 'car')).rejects.toThrow();
 });
 it('handles source stream failures through the existing safe upload error', async () => {
  const upload = { ...file(), createReadStream: () => new Readable({ read() { this.destroy(new Error('private-fixture-error')); } }) };
  await expect(resolver.imageUploader(Promise.resolve(upload), 'car')).rejects.not.toThrow('private-fixture-error');
 });
});
