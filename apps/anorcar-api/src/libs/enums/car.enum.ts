import { registerEnumType } from '@nestjs/graphql';

export enum CarStatus { ACTIVE = 'ACTIVE', SOLD = 'SOLD', DELETE = 'DELETE' }
registerEnumType(CarStatus, { name: 'CarStatus' });

export enum CarFuelType { GASOLINE = 'GASOLINE', DIESEL = 'DIESEL', HYBRID = 'HYBRID', ELECTRIC = 'ELECTRIC', LPG = 'LPG' }
registerEnumType(CarFuelType, { name: 'CarFuelType' });

export enum CarCondition { USED = 'USED', NEW = 'NEW' }
registerEnumType(CarCondition, { name: 'CarCondition' });

export enum CarTransmission { AUTOMATIC = 'AUTOMATIC', MANUAL = 'MANUAL' }
registerEnumType(CarTransmission, { name: 'CarTransmission' });

export enum CarLocation {
	SEOUL = 'SEOUL', BUSAN = 'BUSAN', INCHEON = 'INCHEON', DAEGU = 'DAEGU', GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU', CHONJU = 'CHONJU', DAEJEON = 'DAEJEON', JEJU = 'JEJU',
}
registerEnumType(CarLocation, { name: 'CarLocation' });
