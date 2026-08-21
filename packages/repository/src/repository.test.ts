import assert from 'node:assert/strict';
import test from 'node:test';
import { find } from './repository';

const client = (result: { data: unknown; error: unknown }) => {
  const query = {
    select: () => query,
    filter: () => query,
    order: () => query,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return { from: () => query };
};

test('retourne la collection quand Supabase fournit un tableau', async () => {
  const result = await find<{ id: number }>(client({ data: [{ id: 1 }], error: null }) as never, 'events');
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, [{ id: 1 }]);
});

test('reste fail-closed sur une erreur Supabase', async () => {
  const result = await find(client({ data: null, error: { code: 'network_error' } }) as never, 'events');
  assert.equal(result.ok, false);
});

test('reste fail-closed si Supabase ne renvoie pas une collection', async () => {
  const result = await find(client({ data: null, error: null }) as never, 'events');
  assert.equal(result.ok, false);
});
