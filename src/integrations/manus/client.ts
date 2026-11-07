type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Session {
  access_token?: string;
  user: User;
  [key: string]: unknown;
}

interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  count?: number | null;
}

type Filter = { column: string; operator: string; value: unknown; negate?: boolean };
type Order = { column: string; ascending: boolean; nullsFirst?: boolean };

const API_ROOT = "/api";

function toError(value: unknown, fallback = "The request could not be completed"): ApiError {
  if (value && typeof value === "object" && "message" in value) {
    return value as ApiError;
  }
  return { message: fallback };
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    return { data: null, error: toError(body?.error ?? body, response.statusText) };
  }
  if (body && typeof body === "object" && ("data" in body || "error" in body)) {
    return {
      data: (body.data ?? null) as T | null,
      error: body.error ? toError(body.error) : null,
      count: body.count ?? null,
    };
  }
  return { data: body as T, error: null };
}

class QueryBuilder<T = any> implements PromiseLike<ApiResponse<T[]>> {
  private readonly table: string;
  private operation: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private columns = "*";
  private values: unknown = null;
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private singleMode: "single" | "maybeSingle" | null = null;
  private countMode?: "exact";
  private headMode = false;
  private orExpression?: string;
  private conflictColumns?: string;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }): this {
    this.columns = columns;
    this.countMode = options?.count;
    this.headMode = Boolean(options?.head);
    return this;
  }

  insert(values: unknown): this {
    this.operation = "insert";
    this.values = values;
    return this;
  }

  update(values: unknown): this {
    this.operation = "update";
    this.values = values;
    return this;
  }

  upsert(values: unknown, options?: { onConflict?: string }): this {
    this.operation = "upsert";
    this.values = values;
    this.conflictColumns = options?.onConflict;
    return this;
  }

  delete(): this {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown): this { return this.addFilter(column, "eq", value); }
  neq(column: string, value: unknown): this { return this.addFilter(column, "neq", value); }
  gt(column: string, value: unknown): this { return this.addFilter(column, "gt", value); }
  gte(column: string, value: unknown): this { return this.addFilter(column, "gte", value); }
  lt(column: string, value: unknown): this { return this.addFilter(column, "lt", value); }
  lte(column: string, value: unknown): this { return this.addFilter(column, "lte", value); }
  ilike(column: string, value: unknown): this { return this.addFilter(column, "ilike", value); }
  like(column: string, value: unknown): this { return this.addFilter(column, "like", value); }
  is(column: string, value: unknown): this { return this.addFilter(column, "is", value); }
  in(column: string, values: unknown[]): this { return this.addFilter(column, "in", values); }
  contains(column: string, value: unknown): this { return this.addFilter(column, "contains", value); }
  match(values: Record<string, unknown>): this {
    Object.entries(values).forEach(([column, value]) => this.eq(column, value));
    return this;
  }
  filter(column: string, operator: string, value: unknown): this { return this.addFilter(column, operator, value); }
  not(column: string, operator: string, value: unknown): this {
    return this.addFilter(column, operator, value, true);
  }
  or(expression: string): this { this.orExpression = expression; return this; }
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.orders.push({ column, ascending: options?.ascending !== false, nullsFirst: options?.nullsFirst });
    return this;
  }
  limit(value: number): this { this.limitValue = value; return this; }
  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = Math.max(0, to - from + 1);
    return this;
  }
  single(): Promise<ApiResponse<T>> {
    this.singleMode = "single";
    return this.executeRows().then((result) => {
      const rows = result.data ?? [];
      if (rows.length !== 1) return { data: null, error: { message: rows.length ? "Expected one record" : "Record not found", code: "PGRST116" } };
      return { ...result, data: rows[0] };
    });
  }
  maybeSingle(): Promise<ApiResponse<T | null>> {
    this.singleMode = "maybeSingle";
    return this.executeRows().then((result) => ({ ...result, data: result.data?.[0] ?? null }));
  }
  returns<R>(): QueryBuilder<R> { return this as unknown as QueryBuilder<R>; }
  csv(): Promise<string> {
    return this.executeRows().then(({ data = [] }) => {
      const rows = Array.isArray(data) ? data : [data];
      if (!rows.length) return "";
      const keys = Object.keys(rows[0] as Record<string, unknown>);
      return [keys, ...rows.map((row) => keys.map((key) => JSON.stringify((row as Record<string, unknown>)[key] ?? "")))]
        .map((row) => row.join(","))
        .join("\n");
    });
  }

  then<TResult1 = ApiResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: ApiResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.executeRows().then(onfulfilled, onrejected);
  }

  private addFilter(column: string, operator: string, value: unknown, negate = false): this {
    this.filters.push({ column, operator, value, negate });
    return this;
  }

  private async executeRows(): Promise<ApiResponse<T[]>> {
    const response = await fetch(`${API_ROOT}/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        table: this.table,
        operation: this.operation,
        columns: this.columns,
        values: this.values,
        filters: this.filters,
        orders: this.orders,
        limit: this.limitValue,
        offset: this.offsetValue,
        single: this.singleMode,
        count: this.countMode,
        head: this.headMode,
        or: this.orExpression,
        onConflict: this.conflictColumns,
      }),
    });
    const result = await parseResponse<T[]>(response);
    return result;
  }
}

class AuthClient {
  private listeners = new Set<(event: string, session: Session | null) => void>();

  async getSession(): Promise<{ data: { session: Session | null }; error: ApiError | null }> {
    const response = await fetch(`${API_ROOT}/auth/session`, { credentials: "include" });
    const result = await parseResponse<Session | null>(response);
    return { data: { session: result.data }, error: result.error };
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    this.listeners.add(callback);
    const handler = (event: Event) => callback((event as CustomEvent).detail?.event ?? "SIGNED_IN", (event as CustomEvent).detail?.session ?? null);
    window.addEventListener("manus-auth", handler);
    return {
      data: { subscription: { unsubscribe: () => { this.listeners.delete(callback); window.removeEventListener("manus-auth", handler); } } },
    };
  }

  async signInWithPassword(): Promise<{ data: { session: Session | null }; error: ApiError | null }> {
    return { data: { session: null }, error: { message: "Use Manus login to sign in." } };
  }

  async signUp(): Promise<{ data: { session: Session | null }; error: ApiError | null }> {
    return { data: { session: null }, error: { message: "Account registration is handled by Manus login." } };
  }

  async signOut(): Promise<{ error: ApiError | null }> {
    const response = await fetch(`${API_ROOT}/auth/logout`, { method: "POST", credentials: "include" });
    const result = await parseResponse<null>(response);
    window.dispatchEvent(new CustomEvent("manus-auth", { detail: { event: "SIGNED_OUT", session: null } }));
    return { error: result.error };
  }

  async resetPasswordForEmail(_email?: string, _options?: { redirectTo?: string }): Promise<{ error: ApiError | null }> {
    return { error: { message: "Password recovery is managed by Manus OAuth." } };
  }

  async updateUser(_attributes?: Record<string, unknown>): Promise<{ error: ApiError | null }> {
    return { error: { message: "Profile changes are managed through the application account settings." } };
  }
}

class FunctionClient {
  async invoke<T = any>(name: string, options?: { body?: unknown; headers?: HeadersInit }): Promise<{ data: T | null; error: ApiError | null }> {
    const response = await fetch(`${API_ROOT}/functions/${encodeURIComponent(name)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(options?.body ?? {}),
    });
    return parseResponse<T>(response);
  }
}

class StorageBucket {
  constructor(private readonly bucket: string) {}
  async upload(path: string, file: Blob, options?: { contentType?: string; upsert?: boolean }) {
    const body = new FormData();
    body.append("bucket", this.bucket);
    body.append("path", path);
    body.append("file", file);
    const response = await fetch(`${API_ROOT}/storage/upload`, { method: "POST", body, credentials: "include" });
    return parseResponse<{ path: string; publicUrl: string; fingerprint?: string; width?: number | null; height?: number | null; originalName?: string; originalBytes?: number; processedBytes?: number; watermarked?: boolean }>(response);
  }
  getPublicUrl(path: string) { return { data: { publicUrl: `/manus-storage/${this.bucket}/${path.replace(/^\/+/, "")}` } }; }
  async remove(paths: string[]) {
    const response = await fetch(`${API_ROOT}/storage/remove`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ bucket: this.bucket, paths }) });
    return parseResponse<null>(response);
  }
  list() { return Promise.resolve({ data: [], error: null }); }
}

class StorageClient {
  from(bucket: string) { return new StorageBucket(bucket); }
}

class RealtimeChannel {
  private listeners = new Set<(payload?: unknown) => void>();

  constructor(private readonly name: string) {}

  on(_event: string, _filter: unknown, callback: (payload?: unknown) => void) {
    this.listeners.add(callback);
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    callback?.("SUBSCRIBED");
    return this;
  }

  async send(payload: unknown) {
    for (const listener of this.listeners) listener(payload);
    window.dispatchEvent(new CustomEvent(`manus-channel:${this.name}`, { detail: payload }));
    return { error: null };
  }

  close() {
    this.listeners.clear();
  }
}

class AppClient {
  readonly auth = new AuthClient();
  readonly functions = new FunctionClient();
  readonly storage = new StorageClient();
  from<T = any>(table: string) { return new QueryBuilder<T>(table); }
  async rpc<T = any>(name: string, args?: Record<string, unknown>): Promise<{ data: T | null; error: ApiError | null }> {
    const response = await fetch(`${API_ROOT}/rpc/${encodeURIComponent(name)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args ?? {}),
    });
    return parseResponse<T>(response);
  }
  channel(name: string) { return new RealtimeChannel(name); }
  removeChannel(channel: RealtimeChannel) { channel.close(); return Promise.resolve(); }
}

export const appClient = new AppClient();
