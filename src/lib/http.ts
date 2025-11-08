export async function parseJsonOrThrow<T>(
  res: Response,
  defaultMessage = "Erro ao processar a solicitação."
): Promise<T> {
  if (!res.ok) {
    let message = defaultMessage;
    try {
      const error = await res.json();
      message = error?.message || error?.error || message;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
