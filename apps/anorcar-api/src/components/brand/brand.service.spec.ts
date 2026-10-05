import { BrandService } from './brand.service';
import { BrandStatus } from '../../libs/enums/brand.enum';

describe('BrandService', () => {
	it('maps duplicate brand creation failures to CREATE_FAILED', async () => {
		const model = { create: jest.fn().mockRejectedValue(new Error('duplicate')) };
		const service = new BrandService(model as never);
		await expect(service.createBrand({ brandName: 'BMW', brandLogo: 'logo' })).rejects.toBeDefined();
	});

	it('lists only active brands', async () => {
		const exec = jest.fn().mockResolvedValue([]);
		const sort = jest.fn().mockReturnValue({ exec });
		const model = { find: jest.fn().mockReturnValue({ sort }) };
		const service = new BrandService(model as never);

		await service.getBrands();
		expect(model.find).toHaveBeenCalledWith({ brandStatus: BrandStatus.ACTIVE });
	});

	it('soft-deletes a brand', async () => {
		const brand = { brandStatus: BrandStatus.DELETE };
		const exec = jest.fn().mockResolvedValue(brand);
		const model = { findOneAndUpdate: jest.fn().mockReturnValue({ exec }) };
		const service = new BrandService(model as never);

		await expect(service.removeBrandByAdmin('507f1f77bcf86cd799439011' as never)).resolves.toBe(brand);
		expect(model.findOneAndUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ brandStatus: BrandStatus.ACTIVE }),
			{ brandStatus: BrandStatus.DELETE },
			{ new: true },
		);
	});
});
