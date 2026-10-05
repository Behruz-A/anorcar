import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, Length } from 'class-validator';

@InputType()
export class BrandInput {
	@IsNotEmpty() @Length(1, 60) @Field(() => String) brandName!: string;
	@IsNotEmpty() @Length(1, 300) @Field(() => String) brandLogo!: string;
}
