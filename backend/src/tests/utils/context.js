/**
 * Create a mock WebSocket context for testing flow handlers
 */
function createMockContext() {
  return {
    socket: {
      id: 'test-socket-id',
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn()
    },
    io: {
      emit: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() }))
    },
    flowName: 'weepingWillow',
    eventName: 'test'
  };
}

module.exports = { createMockContext };
