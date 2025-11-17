/**
 * Backend Flow Engine
 *
 * Provides a declarative way to handle WebSocket event flows with:
 * - Input validation
 * - Business logic execution
 * - Output formatting
 * - Middleware support
 */

class FlowEngine {
  constructor() {
    this.flows = new Map();
    this.middleware = [];
  }

  /**
   * Register a flow
   * @param {Object} flowDefinition
   * @param {string} flowDefinition.name - Flow namespace
   * @param {Object} flowDefinition.handlers - Map of event names to handler definitions
   */
  registerFlow(flowDefinition) {
    const { name, handlers } = flowDefinition;

    if (!name || !handlers) {
      throw new Error('Flow definition must include name and handlers');
    }

    this.flows.set(name, flowDefinition);

    // Return flow configuration object for chaining
    return flowDefinition;
  }

  /**
   * Add middleware that runs before all handlers
   * @param {Function} fn - Middleware function (data, context, next)
   */
  use(fn) {
    this.middleware.push(fn);
  }

  /**
   * Get a flow by name
   */
  getFlow(flowName) {
    return this.flows.get(flowName);
  }

  /**
   * Create WebSocket handler for a flow
   * Automatically sets up event listeners for all handlers in the flow
   */
  createHandlers(socket, io, flowName) {
    const flow = this.flows.get(flowName);

    if (!flow) {
      console.error(`Flow not found: ${flowName}`);
      return;
    }

    Object.entries(flow.handlers).forEach(([eventName, handlerDef]) => {
      socket.on(eventName, async (data, callback) => {
        try {
          // Create handler context
          const context = {
            socket,
            io,
            flowName,
            eventName,
            user: null, // Can be populated by middleware
          };

          // Run middleware chain
          let middlewareIndex = 0;
          const next = async () => {
            if (middlewareIndex < this.middleware.length) {
              const middleware = this.middleware[middlewareIndex++];
              await middleware(data, context, next);
            }
          };
          await next();

          // Validate input if schema provided
          if (handlerDef.validate) {
            const validation = handlerDef.validate(data);
            if (!validation.valid) {
              return callback({
                success: false,
                error: validation.error || 'Invalid input'
              });
            }
          }

          // Execute handler
          const result = await handlerDef.handler(data, context);

          // Format output
          const output = handlerDef.formatOutput
            ? handlerDef.formatOutput(result)
            : result;

          // Send response
          if (callback) {
            callback(output);
          }
        } catch (error) {
          console.error(`Error in ${eventName}:`, error);

          if (callback) {
            callback({
              success: false,
              error: error.message || 'Internal server error'
            });
          }
        }
      });
    });
  }

  /**
   * Auto-register all handlers for a flow
   * This is called during server initialization
   */
  setupFlow(socket, io, flowName) {
    this.createHandlers(socket, io, flowName);
  }
}

// Create singleton instance
const flowEngine = new FlowEngine();

module.exports = flowEngine;
