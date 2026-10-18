import 'reflect-metadata';
import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Args, GraphQLModule, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import request from 'supertest';
import { LoggingInterceptor } from './Logging.intercepter';

@Resolver()
class TraceFixture {
 @Query(() => Boolean) ready(): boolean { return true; }
 @Mutation(() => String) auditEcho(@Args('secret') secret: string): string { return secret; }
}
describe('GraphQL metadata-only logging', () => {
 let app: INestApplication;
 beforeAll(async () => {
  const module = await Test.createTestingModule({ imports: [GraphQLModule.forRoot({ driver: ApolloDriver, autoSchemaFile: true })], providers: [TraceFixture] }).compile();
  app = module.createNestApplication();
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.init();
 });
 afterAll(async () => { await app.close(); });
 afterEach(() => jest.restoreAllMocks());
 it('traces real field names and elapsed time without inputs, outputs or user-selected aliases', async () => {
  const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  const result = await request(app.getHttpServer()).post('/graphql').send({
   query: 'mutation($secret:String!){privateAlias:auditEcho(secret:$secret)}', variables: { secret: 'private-password-token-message' },
  });
  expect(result.body.data.privateAlias).toBe('private-password-token-message');
  expect(log).toHaveBeenCalledWith(expect.stringMatching(/^auditEcho - \d+ms$/), 'Response');
  const serialized = JSON.stringify(log.mock.calls);
  expect(serialized).not.toContain('private-password-token-message');
  expect(serialized).not.toContain('privateAlias');
 });
});
