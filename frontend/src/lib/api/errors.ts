export type ApiErrorKind =
  | "not_found"
  | "forbidden"
  | "validation"
  | "server"
  | "network"
  | "invalid_response";

/**
 * A failed call to the training API. `message` is for server logs; pages and
 * actions decide what to show the user based on `kind`.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const detail = await readDetail(response);
    const message = detail ?? `Request failed with status ${response.status}`;

    return new ApiError(kindFromStatus(response.status), message, {
      status: response.status,
    });
  }
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "not_found";
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 404) return "not_found";
  if (status === 403) return "forbidden";
  if (status === 422) return "validation";
  return "server";
}

/** FastAPI sends `{ detail: string }`, or a list of field errors for 422s. */
async function readDetail(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null || !("detail" in body)) {
      return null;
    }

    const { detail } = body;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === "object" && item !== null && "msg" in item
            ? String(item.msg)
            : String(item),
        )
        .join("; ");
    }
    return null;
  } catch {
    return null;
  }
}
