const errorMessages = {
  'avatar-generation': {
    429: 'no more rolls',
    500: 'something went wrong, try again',
  },
  'auth': {
    401: 'please sign in',
    403: 'not allowed',
  },
};

export const getErrorMessage = (context, statusCode, fallback) => {
  const contextMessages = errorMessages[context];
  if (contextMessages && contextMessages[statusCode]) {
    return contextMessages[statusCode];
  }
  return fallback || 'something went wrong';
};

export default errorMessages;
