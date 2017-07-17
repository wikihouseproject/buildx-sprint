
import 'chai';

import wren from '../../src/lib/s';

describe('wren', () => {

  describe('with simple parameters', () => {
    const params = {
      width: 10.0*100,
      height: 20.0*100,
      wallHeight: 8.0*100,
      frameWidth: 10.0,
    };
    const out = wren(params);
    chai.expect(out).to.include.properties(['viewBox', 'points', 'bounds', 'close']);

  });
});