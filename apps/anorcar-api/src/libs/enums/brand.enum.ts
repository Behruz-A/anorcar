import { registerEnumType } from '@nestjs/graphql';

export enum BrandStatus { ACTIVE = 'ACTIVE', DELETE = 'DELETE' }
registerEnumType(BrandStatus, { name: 'BrandStatus' });
