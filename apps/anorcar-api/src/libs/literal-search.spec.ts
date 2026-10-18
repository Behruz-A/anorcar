import { literalSearchRegex } from './config';

describe('Literal search patterns and existing escaped frontend inputs', () => {
 it.each(['A+B (Cars)', '[Seoul]', 'a.*b', '(a+)+$', 'C:\\Cars', 'Hyundai?', '${price}'])('treats raw punctuation in %s as text instead of executable regex', text => {
  expect(literalSearchRegex(text).test(text)).toBe(true);
  expect(literalSearchRegex(text).test('unrelated text')).toBe(false);
 });
 it.each(['A+B (Cars)', '[Seoul]', 'a.*b', '(a+)+$', 'C:\\Cars'])('keeps frontend-escaped %s searches compatible', text => {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  expect(literalSearchRegex(escaped).test(text)).toBe(true);
 });
 it('retains case-insensitive substring search', () => {
  expect(literalSearchRegex('sonata').test('HYUNDAI SONATA Hybrid')).toBe(true);
 });
 it('does not throw for an unbalanced bracket supplied through GraphQL', () => {
  expect(() => literalSearchRegex('[')).not.toThrow();
  expect(literalSearchRegex('[').test('[')).toBe(true);
 });
});
