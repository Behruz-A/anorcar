import 'reflect-metadata';
import { BoardArticleService } from './board-article.service';
import { lookupMember } from '../../libs/config';
import { BoardArticleCategory, BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { Direction } from '../../libs/enums/common.enum';

describe('Public board pagination', () => {
 it('counts and pages the same author-resolved set, keeping likes limited to the selected page', async () => {
  const result = { list: [{ _id: 'post-with-existing-author' }], metaCounter: [{ total: 6 }] };
  const aggregate = jest.fn((_pipeline: unknown[]) => ({ exec: jest.fn().mockResolvedValue([result]) }));
  const service = new BoardArticleService({ aggregate } as never, {} as never, {} as never, {} as never);
  const response = await service.getBoardArticles(null, {
   page: 2, limit: 4, sort: 'articleViews', direction: Direction.DESC,
   search: { articleCategory: BoardArticleCategory.NEWS },
  });
  expect(response).toEqual(result);
  type Stage = { $lookup?: { as: string }; $facet?: { list: Stage[]; metaCounter: unknown[] } };
  const pipeline = aggregate.mock.calls[0][0] as Stage[];
  expect(pipeline[0]).toEqual({ $match: { articleStatus: BoardArticleStatus.ACTIVE, articleCategory: BoardArticleCategory.NEWS } });
  const facetIndex = pipeline.findIndex(stage => stage.$facet);
  const authorIndex = pipeline.findIndex(stage => stage.$lookup?.as === 'memberData');
  expect(authorIndex).toBeGreaterThan(0);
  expect(authorIndex).toBeLessThan(facetIndex);
  expect(pipeline[authorIndex]).toEqual(lookupMember);
  expect(pipeline[authorIndex + 1]).toEqual({ $unwind: '$memberData' });
  const facet = pipeline[facetIndex].$facet!;
  expect(facet.list.slice(0, 2)).toEqual([{ $skip: 4 }, { $limit: 4 }]);
  expect(facet.metaCounter).toEqual([{ $count: 'total' }]);
  expect(facet.list.some(stage => stage.$lookup?.as === 'meLiked')).toBe(true);
  expect(facet.list.some(stage => stage.$lookup?.as === 'memberData')).toBe(false);
 });
});
