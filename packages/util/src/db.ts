export type BatchDBOp<
  TKey extends Uint8Array | string = Uint8Array,
  TValue extends Uint8Array | string = Uint8Array
> = PutBatch<TKey, TValue> | DelBatch<TKey>

export interface PutBatch<
  TKey extends Uint8Array | string = Uint8Array,
  TValue extends Uint8Array | string = Uint8Array
> {
  type: 'put'
  key: TKey
  value: TValue
}

export interface DelBatch<TKey extends Uint8Array | string = Uint8Array> {
  type: 'del'
  key: TKey
}

export interface DB<
  TKey extends Uint8Array | string = Uint8Array,
  TValue extends Uint8Array | string = Uint8Array
> {
  /**
   * Retrieves a raw value from db.
   * @param key
   * @returns A Promise that resolves to `Uint8Array` if a value is found or `undefined` if no value is found.
   */
  get(key: TKey): Promise<TValue | undefined>

  /**
   * Writes a value directly to db.
   * @param key The key as a `TValue`
   * @param value The value to be stored
   */
  put(key: TKey, val: TValue): Promise<void>

  /**
   * Removes a raw value in the underlying db.
   * @param keys
   */
  del(key: TKey): Promise<void>

  /**
   * Performs a batch operation on db.
   * @param opStack A stack of levelup operations
   */
  batch(opStack: BatchDBOp<TKey, TValue>[]): Promise<void>

  /**
   * Returns a copy of the DB instance, with a reference
   * to the **same** underlying db instance.
   */
  copy(): DB<TKey, TValue>

  /**
   * Opens the database -- if applicable
   */
  open(): Promise<void>
  // TODO - decide if we actually need open/close - it's not required for maps and Level automatically opens the DB when you instantiate it
}