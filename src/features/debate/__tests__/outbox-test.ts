import AsyncStorage from '@react-native-async-storage/async-storage';

import { activateUserSession } from '@/features/auth/userSession';
import { enqueueDebateAward, getPendingOutboxForClient } from '@/features/debate/outbox';

const TEST_USER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

describe('S-5 outbox', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await activateUserSession(TEST_USER);
  });

  it('queues a solo item with client_id when offline delivery is needed', async () => {
    await enqueueDebateAward({
      clientId: '11111111-1111-1111-1111-111111111111',
      kind: 'solo',
      xp: 1,
    });
    const pending = await getPendingOutboxForClient('11111111-1111-1111-1111-111111111111');
    expect(pending?.kind).toBe('solo');
    expect(pending?.xp).toBe(1);
  });

  it('does not duplicate outbox rows for the same client_id', async () => {
    const clientId = '22222222-2222-2222-2222-222222222222';
    await enqueueDebateAward({ clientId, kind: 'pass', xp: 3 });
    await enqueueDebateAward({ clientId, kind: 'pass', xp: 99 });
    const pending = await getPendingOutboxForClient(clientId);
    expect(pending?.xp).toBe(3);
  });
});
