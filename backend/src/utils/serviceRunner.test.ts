import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { childEnv, isRunnableService, truncateLogChunk } from './serviceRunner.js';

describe('serviceRunner', () => {
  it('gates start/stop on directory + command', () => {
    assert.equal(isRunnableService('C:\\app', 'npm run dev'), true);
    assert.equal(isRunnableService('', 'npm run dev'), false);
    assert.equal(isRunnableService('C:\\app', '   '), false);
  });

  it('caps log chunks', () => {
    assert.equal(truncateLogChunk('x'.repeat(5000)).length, 4000);
    assert.equal(truncateLogChunk('ok'), 'ok');
  });

  it('does not leak Localy config into the child env', () => {
    const childEnvResult = childEnv({ host: 'localhost', port: 8001 });
    assert.equal(childEnvResult.PORT, '8001');
    assert.equal(childEnvResult.HOST, 'localhost');
    assert.equal('DATABASE_URL' in childEnvResult, false);
    assert.equal('JWT_SECRET' in childEnvResult, false);
    assert.equal('API_RESPONSE_DELAY' in childEnvResult, false);
    assert.ok(childEnvResult.PATH ?? childEnvResult.Path);
  });
});
