import 'reflect-metadata';
import { CommentService } from './comment.service';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { LikeService } from '../like/like.service';
import { ViewService } from '../view/view.service';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ViewGroup } from '../../libs/enums/view.enum';

const id = '507f1f77bcf86cd799439011';
const record = { _id: id, memberId: id, commentRefId: id, commentGroup: CommentGroup.ARTICLE, commentStatus: CommentStatus.ACTIVE, commentContent: 'Fixture' };
function setup() {
 const model = { create: jest.fn().mockResolvedValue(record), findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(record) }), findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(record) }) };
 const member = { memberStatsEditor: jest.fn().mockResolvedValue({}) }, car = { carStatsEditor: jest.fn().mockResolvedValue({}) }, article = { boardArticleStatsEditor: jest.fn().mockResolvedValue({}) };
 return { model, member, car, article, service: new CommentService(model as never, member as never, car as never, article as never) };
}
describe('Comment deletion counters', () => {
 it.each([CommentGroup.CAR, CommentGroup.ARTICLE, CommentGroup.MEMBER])('decrements the appropriate %s counter once when a visible comment is deleted', async commentGroup => {
  const { model, service, member, car, article } = setup();
  model.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ ...record, commentGroup, commentStatus: CommentStatus.DELETE }) });
  await service.updateComment(id as never, { _id: id, commentStatus: CommentStatus.DELETE } as never);
  const calls = [...member.memberStatsEditor.mock.calls, ...car.carStatsEditor.mock.calls, ...article.boardArticleStatsEditor.mock.calls];
  expect(calls).toHaveLength(1);
  expect(calls[0][0]).toEqual({ _id: id, targetKey: commentGroup === CommentGroup.CAR ? 'carComments' : commentGroup === CommentGroup.ARTICLE ? 'articleComments' : 'memberComments', modifier: -1 });
 });
 it('does not change a counter when only editing comment text', async () => {
  const { service, article } = setup();
  await service.updateComment(id as never, { _id: id, commentContent: 'Edited' } as never);
  expect(article.boardArticleStatsEditor).not.toHaveBeenCalled();
 });
 it('does not decrement again when a repeated deletion finds no ACTIVE comment', async () => {
  const { model, service, article } = setup();
  model.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
  await expect(service.updateComment(id as never, { _id: id, commentStatus: CommentStatus.DELETE } as never)).rejects.toThrow();
  expect(article.boardArticleStatsEditor).not.toHaveBeenCalled();
 });
 it.each([CommentStatus.ACTIVE, CommentStatus.DELETE])('admin removal handles %s comments without double-counting', async commentStatus => {
  const { model, service, article } = setup();
  model.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({ ...record, commentStatus }) });
  await service.removeCommentByAdmin(id as never);
  expect(article.boardArticleStatsEditor).toHaveBeenCalledTimes(commentStatus === CommentStatus.ACTIVE ? 1 : 0);
 });
 it('retains the existing increment on comment creation', async () => {
  const { service, article } = setup();
  await service.createComment(id as never, record as never);
  expect(article.boardArticleStatsEditor).toHaveBeenCalledWith({ _id: id, targetKey: 'articleComments', modifier: 1 });
 });
});
describe('Simultaneous viewer interactions', () => {
 it('does not decrement for an unlike already removed by another request', async () => {
  const service = new LikeService({ findOne: () => ({ exec: async () => ({ _id: id }) }), findOneAndDelete: () => ({ exec: async () => null }) } as never);
  expect(await service.toggleLike({ memberId: id, likeRefId: id, likeGroup: LikeGroup.CAR } as never)).toBe(0);
 });
 it('does not increment twice after a duplicate like insert', async () => {
  const service = new LikeService({ findOne: () => ({ exec: async () => null }), create: async () => { throw { code: 11000 }; } } as never);
  expect(await service.toggleLike({ memberId: id, likeRefId: id, likeGroup: LikeGroup.CAR } as never)).toBe(0);
 });
 it('does not fail or increment twice after a duplicate first-visit insert', async () => {
  const service = new ViewService({ findOne: () => ({ exec: async () => null }), create: async () => { throw { code: 11000 }; } } as never);
  expect(await service.recordView({ memberId: id, viewRefId: id, viewGroup: ViewGroup.ARTICLE } as never)).toBeNull();
 });
 it('continues to surface real view-storage failures', async () => {
  const service = new ViewService({ findOne: () => ({ exec: async () => null }), create: async () => { throw new Error('fixture-storage-failure'); } } as never);
  await expect(service.recordView({ memberId: id, viewRefId: id, viewGroup: ViewGroup.ARTICLE } as never)).rejects.toThrow('fixture-storage-failure');
 });
});
