export const ERRORS = {
  // Classes, types
  ONLY_ONE_INSTANCE_ALLOWED: `Only one instance of %0 can be instantiated.`,
	MUST_OVERRIDE_METHOD: `%0 failed to override method %1`,

  // Service Providers
  SERVICE_PROVIDER_ERROR: `ServiceProvider %0 could not be reached.`,

  // Events & Communication
  IPC_NOT_FOUND: `IPC passthrough not found on Window object.`,
  EVENT_ROUTING_NOT_FOUND: `Event Router could not be located`,
  EVENT_ROUTING_NOT_LINKED: `%0 is not linked to an Event Routing service.`,
  UNKNOWN_EVENT_DOMAIN: `Unknown event type received: %0`,
  SOCKET_NOT_FOUND: `SocketIo client socket could not be found.`,
  AUTH_FAILED: `Authentication with server failed.`,

}