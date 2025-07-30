export const trimTextAndDefaultToEmpty = (text: string | null | undefined) => {
  return text?.trim() || '';
};

export const getStringFromError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
