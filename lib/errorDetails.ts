export interface ErrorDetails {
  code?: string;
  message?: string;
  status?: number;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : undefined;
}

export function getErrorDetails(error: unknown): ErrorDetails {
  const errorRecord = asRecord(error);
  const response = asRecord(errorRecord?.response);
  const data = asRecord(response?.data);

  return {
    code: typeof data?.code === 'string'
      ? data.code
      : typeof errorRecord?.code === 'string'
        ? errorRecord.code
        : undefined,
    message: typeof data?.message === 'string' ? data.message : undefined,
    status: typeof response?.status === 'number' ? response.status : undefined,
  };
}
