export type ParsedSubmissionRequest =
  | { ok: true; payload: unknown; nativeForm: boolean; newsletter: boolean }
  | { ok: false; error: 'invalid_json' | 'unsupported_media_type' };

export const parseSubmissionRequest = (contentType: string, body: string): ParsedSubmissionRequest => {
  if (contentType.toLowerCase().startsWith('application/json')) {
    try {
      return { ok: true, payload: JSON.parse(body), nativeForm: false, newsletter: false };
    } catch {
      return { ok: false, error: 'invalid_json' };
    }
  }

  if (contentType.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(body);
    const payload: Record<string, unknown> = Object.fromEntries(params.entries());
    const newsletter = params.get('newsletter') === 'on';
    delete payload.newsletter;
    payload.departement = Number(params.get('departement') ?? '');
    payload.consent = params.get('consent') === 'on';
    return { ok: true, payload, nativeForm: true, newsletter };
  }

  return { ok: false, error: 'unsupported_media_type' };
};
