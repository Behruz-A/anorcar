import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { Brand } from '../../libs/dto/brand/brand';
import { BrandInput } from '../../libs/dto/brand/brand.input';
import { BrandUpdate } from '../../libs/dto/brand/brand.update';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { BrandService } from './brand.service';

@Resolver()
export class BrandResolver {
	constructor(private readonly brandService: BrandService) {}

	@UseGuards(WithoutGuard)
	@Query(() => [Brand])
	public async getBrands(): Promise<Brand[]> { return await this.brandService.getBrands(); }

	@UseGuards(WithoutGuard)
	@Query(() => Brand)
	public async getBrand(@Args('brandId') input: string): Promise<Brand> {
		return await this.brandService.getBrand(shapeIntoMongoObjectId(input));
	}

	@Roles(MemberType.ADMIN) @UseGuards(RolesGuard)
	@Mutation(() => Brand)
	public async createBrand(@Args('input') input: BrandInput): Promise<Brand> { return await this.brandService.createBrand(input); }

	@Roles(MemberType.ADMIN) @UseGuards(RolesGuard)
	@Query(() => [Brand])
	public async getAllBrandsByAdmin(): Promise<Brand[]> { return await this.brandService.getAllBrandsByAdmin(); }

	@Roles(MemberType.ADMIN) @UseGuards(RolesGuard)
	@Mutation(() => Brand)
	public async updateBrandByAdmin(@Args('input') input: BrandUpdate): Promise<Brand> {
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.brandService.updateBrandByAdmin(input);
	}

	@Roles(MemberType.ADMIN) @UseGuards(RolesGuard)
	@Mutation(() => Brand)
	public async removeBrandByAdmin(@Args('brandId') input: string): Promise<Brand> {
		return await this.brandService.removeBrandByAdmin(shapeIntoMongoObjectId(input));
	}
}
