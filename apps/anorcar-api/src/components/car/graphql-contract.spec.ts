import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { CarResolver } from './car.resolver';
import { BrandResolver } from '../brand/brand.resolver';

describe('Car GraphQL contract', () => {
	it('exposes Car and Brand operations without legacy Property types', async () => {
		const moduleRef = await Test.createTestingModule({ imports: [GraphQLSchemaBuilderModule] }).compile();
		const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
		const schema = printSchema(await schemaFactory.create([CarResolver, BrandResolver]));

		expect(schema).toContain('type Car');
		expect(schema).toContain('type Brand');
		expect(schema).toContain('getCars(input: CarsInquiry!): Cars!');
		expect(schema).toContain('createCar(input: CarInput!): Car!');
		expect(schema).toContain('getBrands: [Brand!]!');
		expect(schema).not.toMatch(/Property|properties|PROPERTY/);
	});
});
