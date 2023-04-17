import { getRandomBytesSync } from 'ethereum-cryptography/random'
import { bytesToHex, bytesToUtf8, hexToBytes } from 'ethereum-cryptography/utils'

import { assertIsArray, assertIsBytes, assertIsHexString } from './helpers'
import { isHexPrefixed, isHexString, padToEven, stripHexPrefix } from './internal'

import type { PrefixedHexString, TransformabletoBytes } from './types'

/****************  Borrowed from @chainsafe/ssz */
// Caching this info costs about ~1000 bytes and speeds up toHexString() by x6
const hexByByte = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'))

export const bytesToPrefixedHexString = (bytes: Uint8Array): string => {
  let hex = '0x'
  if (bytes === undefined || bytes.length === 0) return hex
  for (const byte of bytes) {
    hex += hexByByte[byte]
  }
  return hex
}

export const hexStringToBytes = (hex: string): Uint8Array => {
  if (typeof hex !== 'string') {
    throw new Error(`hex argument type ${typeof hex} must be of type string`)
  }

  if (hex.startsWith('0x')) {
    hex = hex.slice(2)
  }

  if (hex.length % 2 !== 0) {
    hex = padToEven(hex)
  }

  const byteLen = hex.length / 2
  const bytes = new Uint8Array(byteLen)
  for (let i = 0; i < byteLen; i++) {
    const byte = parseInt(hex.slice(i * 2, (i + 1) * 2), 16)
    bytes[i] = byte
  }
  return bytes
}

/******************************************/

/**
 * Converts a `Number` into a hex `String`
 * @param {Number} i
 * @return {String}
 */
export const intToHex = function (i: number) {
  if (!Number.isSafeInteger(i) || i < 0) {
    throw new Error(`Received an invalid integer type: ${i}`)
  }
  return `0x${i.toString(16)}`
}

/**
 * Converts an `Number` to a `Buffer`
 * @param {Number} i
 * @return {Buffer}
 */
export const intToBytes = function (i: number) {
  const hex = intToHex(i)
  return hexToBytes(padToEven(hex.slice(2)))
}

/**
 * Returns a buffer filled with 0s.
 * @param bytes the number of bytes the buffer should be
 */
export const zeros = function (bytes: number): Uint8Array {
  return new Uint8Array(bytes)
}

/**
 * Pads a `Uint8Array` with zeros till it has `length` bytes.
 * Truncates the beginning or end of input if its length exceeds `length`.
 * @param msg the value to pad (Uint8Array)
 * @param length the number of bytes the output should be
 * @param right whether to start padding form the left or right
 * @return (Buffer)
 */
const setLength = function (msg: Uint8Array, length: number, right: boolean) {
  if (right) {
    if (msg.length < length) {
      return new Uint8Array([...msg, ...zeros(length - msg.length)])
    }
    return msg.subarray(0, length)
  } else {
    if (msg.length < length) {
      return new Uint8Array([...zeros(length - msg.length), ...msg])
    }
    return msg.subarray(-length)
  }
}

/**
 * Left Pads a `Uint8Array` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @param msg the value to pad (Buffer)
 * @param length the number of bytes the output should be
 * @return (Uint8Array)
 */
export const setLengthLeft = function (msg: Uint8Array, length: number) {
  assertIsBytes(msg)
  return setLength(msg, length, false)
}

/**
 * Right Pads a `Uint8Array` with trailing zeros till it has `length` bytes.
 * it truncates the end if it exceeds.
 * @param msg the value to pad (Uint8Array)
 * @param length the number of bytes the output should be
 * @return (Uint8Array)
 */
export const setLengthRight = function (msg: Uint8Array, length: number) {
  assertIsBytes(msg)
  return setLength(msg, length, true)
}

/**
 * Trims leading zeros from a `Uint8Array`, `String` or `Number[]`.
 * @param a (Uint8Array|Array|String)
 * @return (Uint8Array|Array|String)
 */
const stripZeros = function (a: any): Uint8Array | number[] | string {
  let first = a[0]
  while (a.length > 0 && first.toString() === '0') {
    a = a.slice(1)
    first = a[0]
  }
  return a
}

/**
 * Trims leading zeros from a `Uint8Array`.
 * @param a (Uint8Array)
 * @return (Uint8Array)
 */
export const unpadBytes = function (a: Uint8Array): Uint8Array {
  assertIsBytes(a)
  return stripZeros(a) as Uint8Array
}

/**
 * Trims leading zeros from an `Array` (of numbers).
 * @param a (number[])
 * @return (number[])
 */
export const unpadArray = function (a: number[]): number[] {
  assertIsArray(a)
  return stripZeros(a) as number[]
}

/**
 * Trims leading zeros from a hex-prefixed `String`.
 * @param a (String)
 * @return (String)
 */
export const unpadHexString = function (a: string): string {
  assertIsHexString(a)
  a = stripHexPrefix(a)
  return ('0x' + stripZeros(a)) as string
}

export type ToBytesInputTypes =
  | PrefixedHexString
  | number
  | bigint
  | Uint8Array
  | number[]
  | TransformabletoBytes
  | null
  | undefined

/**
 * Attempts to turn a value into a `Uint8Array`.
 * Inputs supported: `Buffer`, `Uint8Array`, `String` (hex-prefixed), `Number`, null/undefined, `BigInt` and other objects
 * with a `toArray()` or `toBytes()` method.
 * @param v the value
 */

export const toBytes = function (v: ToBytesInputTypes): Uint8Array {
  if (v === null || v === undefined) {
    return new Uint8Array()
  }

  if (Array.isArray(v) || v instanceof Uint8Array) {
    return Uint8Array.from(v)
  }

  if (typeof v === 'string') {
    if (!isHexString(v)) {
      throw new Error(
        `Cannot convert string to Uint8Array. toBytes only supports 0x-prefixed hex strings and this string was given: ${v}`
      )
    }
    return hexToBytes(padToEven(v.slice(2)))
  }

  if (typeof v === 'number') {
    return intToBytes(v)
  }

  if (typeof v === 'bigint') {
    if (v < BigInt(0)) {
      throw new Error(`Cannot convert negative bigint to Uint8Array. Given: ${v}`)
    }
    let n = v.toString(16)
    if (n.length % 2) n = '0' + n
    return hexToBytes(n)
  }

  if (v.toBytes !== undefined) {
    // converts a `TransformableToBytes` object to a Uint8Array
    return v.toBytes()
  }

  throw new Error('invalid type')
}

/**
 * Converts a {@link Uint8Array} to a {@link bigint}
 */
export function bytesToBigInt(bytes: Uint8Array) {
  const hex = bytesToPrefixedHexString(bytes)
  if (hex === '0x') {
    return BigInt(0)
  }
  return BigInt(hex)
}

/**
 * Converts a {@link bigint} to a {@link Uint8Array}
 */
export const bigIntToBytes = (num: bigint) => {
  return toBytes('0x' + padToEven(num.toString(16)))
}

/**
 * Converts a `Uint8Array` to a `Number`.
 * @param bytes `Uint8Array` object to convert
 * @throws If the input number exceeds 53 bits.
 */
export const bytesToInt = function (bytes: Uint8Array): number {
  const res = Number(bytesToBigInt(bytes))
  if (!Number.isSafeInteger(res)) throw new Error('Number exceeds 53 bits')
  return res
}

/**
 * Interprets a `Uint8Array` as a signed integer and returns a `BigInt`. Assumes 256-bit numbers.
 * @param num Signed integer value
 */
export const fromSigned = function (num: Uint8Array): bigint {
  return BigInt.asIntN(256, bytesToBigInt(num))
}

/**
 * Converts a `BigInt` to an unsigned integer and returns it as a `Uint8Array`. Assumes 256-bit numbers.
 * @param num
 */
export const toUnsigned = function (num: bigint): Uint8Array {
  return bigIntToBytes(BigInt.asUintN(256, num))
}

/**
 * Adds "0x" to a given `String` if it does not already start with "0x".
 */
export const addHexPrefix = function (str: string): string {
  if (typeof str !== 'string') {
    return str
  }

  return isHexPrefixed(str) ? str : '0x' + str
}

/**
 * Shortens a string  or Uint8Array's hex string representation to maxLength (default 50).
 *
 * Examples:
 *
 * Input:  '657468657265756d000000000000000000000000000000000000000000000000'
 * Output: '657468657265756d0000000000000000000000000000000000…'
 */
export function short(bytes: Uint8Array | string, maxLength: number = 50): string {
  const byteStr = bytes instanceof Uint8Array ? bytesToHex(bytes) : bytes
  if (byteStr.length <= maxLength) {
    return byteStr
  }
  return byteStr.slice(0, maxLength) + '…'
}

/**
 * Returns the utf8 string representation from a hex string.
 *
 * Examples:
 *
 * Input 1: '657468657265756d000000000000000000000000000000000000000000000000'
 * Input 2: '657468657265756d'
 * Input 3: '000000000000000000000000000000000000000000000000657468657265756d'
 *
 * Output (all 3 input variants): 'ethereum'
 *
 * Note that this method is not intended to be used with hex strings
 * representing quantities in both big endian or little endian notation.
 *
 * @param string Hex string, should be `0x` prefixed
 * @return Utf8 string
 */
export const toUtf8 = function (hex: string): string {
  const zerosRegexp = /^(00)+|(00)+$/g
  hex = stripHexPrefix(hex)
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid non-even hex string input for toUtf8() provided')
  }
  const bytesVal = hexToBytes(hex.replace(zerosRegexp, ''))

  return bytesToUtf8(bytesVal)
}

/**
 * Checks provided Uint8Array for leading zeroes and throws if found.
 *
 * Examples:
 *
 * Valid values: 0x1, 0x, 0x01, 0x1234
 * Invalid values: 0x0, 0x00, 0x001, 0x0001
 *
 * Note: This method is useful for validating that RLP encoded integers comply with the rule that all
 * integer values encoded to RLP must be in the most compact form and contain no leading zero bytes
 * @param values An object containing string keys and Uint8Array values
 * @throws if any provided value is found to have leading zero bytes
 */
export const validateNoLeadingZeroes = function (values: {
  [key: string]: Uint8Array | undefined
}) {
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && v.length > 0 && v[0] === 0) {
      throw new Error(`${k} cannot have leading zeroes, received: ${bytesToHex(v)}`)
    }
  }
}

/**
 * Converts a {@link bigint} to a `0x` prefixed hex string
 */
export const bigIntToHex = (num: bigint) => {
  return '0x' + num.toString(16)
}

/**
 * Convert value from bigint to an unpadded Uint8Array
 * (useful for RLP transport)
 * @param value value to convert
 */
export function bigIntToUnpaddedBytes(value: bigint): Uint8Array {
  return unpadBytes(bigIntToBytes(value))
}

export function intToUnpaddedBytes(value: number): Uint8Array {
  return unpadBytes(intToBytes(value))
}

/**
 * Compares two Uint8Arrays and returns a number indicating their order in a sorted array.
 *
 * @param {Uint8Array} value1 - The first Uint8Array to compare.
 * @param {Uint8Array} value2 - The second Uint8Array to compare.
 * @returns {number} A positive number if value1 is larger than value2,
 *                   A negative number if value1 is smaller than value2,
 *                   or 0 if value1 and value2 are equal.
 */
export function compareBytes(value1: Uint8Array, value2: Uint8Array): number {
  const bigIntValue1 = bytesToBigInt(value1)
  const bigIntValue2 = bytesToBigInt(value2)
  return bigIntValue1 > bigIntValue2 ? 1 : bigIntValue1 < bigIntValue2 ? -1 : 0
}

/**
 * Generates a Uint8Array of random bytes of specified length.
 *
 * @param {number} length - The length of the Uint8Array.
 * @returns {Uint8Array} A Uint8Array of random bytes of specified length.
 */
export function randomBytes(length: number): Uint8Array {
  return getRandomBytesSync(length)
}

/**
 * This mirrors the functionality of the `ethereum-cryptography` export except
 * it skips the check to validate that every element of `arrays` is indead a `uint8Array`
 * Can give small performance gains on large arrays
 * @param arrays an array of Uint8Arrays
 * @returns one Uint8Array with all the elements of the original set
 * works like `Buffer.concat`
 */
export const concatBytesNoTypeCheck = (...arrays: Uint8Array[]) => {
  if (arrays.length === 1) return arrays[0]
  const length = arrays.reduce((a, arr) => a + arr.length, 0)
  const result = new Uint8Array(length)
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const arr = arrays[i]
    result.set(arr, pad)
    pad += arr.length
  }
  return result
}
/**
 * @notice Read a 32-bit little-endian integer from a Uint8Array
 * @param {Uint8Array} bytes The input Uint8Array from which to read the 32-bit integer.
 * @return {number} The 32-bit little-endian integer read from the input Uint8Arrays.
 */
export function readInt32LE(bytes: Uint8Array): number {
  return (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) >>> 0
}

/**
 * @notice Read a 64-bit little-endian bigint from a Uint8Array
 * @param {Uint8Array} bytes The input Uint8Array from which to read the 64-bit bigint.
 * @return {bigint} The 64-bit little-endian bigint read from the input Uint8Arrays.
 */
export function readBigInt64LE(bytes: Uint8Array): bigint {
  const lo = BigInt((bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) >>> 0)
  const hi = BigInt((bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)) >>> 0)

  return (hi << BigInt(32)) | lo
}

/**
 * @notice Write a 32-bit little-endian number to a Uint8Array.
 * @param {number} number The number value to write to the Uint8Array.
 * @return {Uint8Array} A Uint8Array of length 32 containing the 32-bit little-endian number.
 */
export function writeInt32LE(number: number): Uint8Array {
  const bytes = new Uint8Array(32)

  bytes[0] = number & 0xff
  bytes[1] = (number >> 8) & 0xff
  bytes[2] = (number >> 16) & 0xff
  bytes[3] = (number >> 24) & 0xff

  return bytes
}

/**
 * @notice Write a 64-bit little-endian bigint to a Uint8Array.
 * @param {bigint} bigint The bigint value to write to the Uint8Array.
 * @return {Uint8Array} A Uint8Array of length 32 containing the 64-bit little-endian bigint.
 */
export function writeBigInt64LE(bigint: bigint): Uint8Array {
  const bytes = new Uint8Array(32)

  const lo = BigInt.asUintN(32, bigint)
  const hi = BigInt.asUintN(32, bigint >> BigInt(32))

  bytes[0] = Number(lo & BigInt(0xff))
  bytes[1] = Number((lo >> BigInt(8)) & BigInt(0xff))
  bytes[2] = Number((lo >> BigInt(16)) & BigInt(0xff))
  bytes[3] = Number((lo >> BigInt(24)) & BigInt(0xff))

  bytes[4] = Number(hi & BigInt(0xff))
  bytes[5] = Number((hi >> BigInt(8)) & BigInt(0xff))
  bytes[6] = Number((hi >> BigInt(16)) & BigInt(0xff))
  bytes[7] = Number((hi >> BigInt(24)) & BigInt(0xff))

  return bytes
}

export {
  bytesToHex,
  bytesToUtf8,
  concatBytes,
  equalsBytes,
  utf8ToBytes,
} from 'ethereum-cryptography/utils'
