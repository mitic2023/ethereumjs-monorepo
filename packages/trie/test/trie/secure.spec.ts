import {
  bytesToPrefixedHexString,
  bytesToUtf8,
  equalsBytes,
  hexStringToBytes,
  utf8ToBytes,
} from '@ethereumjs/util'
import * as tape from 'tape'

import { MapDB, ROOT_DB_KEY, Trie } from '../../src'

tape('SecureTrie', function (t) {
  const trie = new Trie({ useKeyHashing: true, db: new MapDB() })
  const k = utf8ToBytes('foo')
  const v = utf8ToBytes('bar')

  t.test('put and get value', async function (st) {
    await trie.put(k, v)
    const res = await trie.get(k)
    st.ok(equalsBytes(v, res!))
    st.end()
  })

  t.test('copy trie', async function (st) {
    const t = await trie.copy()
    const res = await t.get(k)
    st.ok(equalsBytes(v, res!))
    st.end()
  })

  tape('SecureTrie proof', function (t) {
    t.test('create a merkle proof and verify it with a single short key', async function (st) {
      const trie = await Trie.create()
      await trie.put(utf8ToBytes('key1aa'), utf8ToBytes('01234'))

      const proof = await trie.createProof(utf8ToBytes('key1aa'))
      const val = await trie.verifyProof(trie.root(), utf8ToBytes('key1aa'), proof)
      // console.log({ proof, val })
      st.equal(bytesToUtf8(val!), '01234')
      st.end()
    })
  })

  tape('secure tests', function (it) {
    let trie = new Trie({ useKeyHashing: true, db: new MapDB() })
    const jsonTests = require('../fixtures/trietest_secureTrie.json').tests

    it.test('empty values', async function (t) {
      for (const row of jsonTests.emptyValues.in) {
        const val =
          row[1] !== undefined && row[1] !== null
            ? utf8ToBytes(row[1])
            : (null as unknown as Uint8Array)
        await trie.put(utf8ToBytes(row[0]), val)
      }
      t.equal(bytesToPrefixedHexString(trie.root()), jsonTests.emptyValues.root)
      t.end()
    })

    it.test('branchingTests', async function (t) {
      trie = new Trie({ useKeyHashing: true, db: new MapDB() })
      for (const row of jsonTests.branchingTests.in) {
        const val =
          row[1] !== undefined && row[1] !== null
            ? utf8ToBytes(row[1])
            : (null as unknown as Uint8Array)
        await trie.put(utf8ToBytes(row[0]), val)
      }
      t.equal(bytesToPrefixedHexString(trie.root()), jsonTests.branchingTests.root)
      t.end()
    })

    it.test('jeff', async function (t) {
      for (const row of jsonTests.jeff.in) {
        let val = row[1]
        if (val !== undefined && val !== null) {
          val = hexStringToBytes(row[1].slice(2))
        }
        await trie.put(hexStringToBytes(row[0].slice(2)), val)
      }
      t.equal(bytesToPrefixedHexString(trie.root()), jsonTests.jeff.root)
      t.end()
    })

    it.test('put fails if the key is the ROOT_DB_KEY', async function (st) {
      const trie = new Trie({ useKeyHashing: true, db: new MapDB(), useRootPersistence: true })

      try {
        await trie.put(ROOT_DB_KEY, utf8ToBytes('bar'))

        st.fail("Attempting to set '__root__' should fail but it did not.")
      } catch (e: any) {
        st.equal(e.message, "Attempted to set '__root__' key but it is not allowed.")
      }
    })
  })
})

const trie = new Trie({ useKeyHashing: true, db: new MapDB() })
const a = hexStringToBytes(
  'f8448080a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0a155280bc3c09fd31b0adebbdd4ef3d5128172c0d2008be964dc9e10e0f0fedf'
)
const ak = hexStringToBytes('095e7baea6a6c7c4c2dfeb977efac326af552d87')
const b = hexStringToBytes(
  'f844802ea056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0db94dc4aab9b6a1a11956906ea34f3252f394576aece12199b23b269bb2738ab'
)
const bk = hexStringToBytes('945304eb96065b2a98b57a48a06ae28d285a71b5')
const c = hexStringToBytes(
  'f84c80880de0b6b3a7640000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
)
const ck = hexStringToBytes('a94f5374fce5edbc8e2a8697c15331677e6ebf0b')
// checkpoint
// checkpoint
// commit
const d = hexStringToBytes(
  'f8488084535500b1a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0a155280bc3c09fd31b0adebbdd4ef3d5128172c0d2008be964dc9e10e0f0fedf'
)
const dk = hexStringToBytes('095e7baea6a6c7c4c2dfeb977efac326af552d87')
const e = hexStringToBytes(
  'f8478083010851a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0db94dc4aab9b6a1a11956906ea34f3252f394576aece12199b23b269bb2738ab'
)
const ek = hexStringToBytes('945304eb96065b2a98b57a48a06ae28d285a71b5')
const f = hexStringToBytes(
  'f84c01880de0b6b3540df72ca056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
)
const fk = hexStringToBytes('a94f5374fce5edbc8e2a8697c15331677e6ebf0b')
// commit
const g = hexStringToBytes(
  'f8488084535500b1a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0a155280bc3c09fd31b0adebbdd4ef3d5128172c0d2008be964dc9e10e0f0fedf'
)
const gk = hexStringToBytes('095e7baea6a6c7c4c2dfeb977efac326af552d87')

tape('secure tests should not crash', async function (t) {
  await trie.put(ak, a)
  await trie.put(bk, b)
  await trie.put(ck, c)
  trie.checkpoint()
  trie.checkpoint()
  await trie.commit()
  await trie.put(dk, d)
  await trie.put(ek, e)
  await trie.put(fk, f)
  await trie.commit()
  await trie.put(gk, g)
  t.end()
})

tape('Secureawait trie.copy', function (it) {
  it.test('created copy includes values added after checkpoint', async function (t) {
    const trie = new Trie({ useKeyHashing: true, db: new MapDB() })

    await trie.put(utf8ToBytes('key1'), utf8ToBytes('value1'))
    await trie.put(utf8ToBytes('key2'), utf8ToBytes('value2'))
    trie.checkpoint()
    const trieCopy = await trie.copy()
    const value = await trieCopy.get(utf8ToBytes('key2'))
    t.ok(value, `trieCopy.get(key2): ${value ? bytesToUtf8(value) : 'null'}`)
    t.end()
  })

  it.test('created copy includes values added before checkpoint', async function (t) {
    const trie = await Trie.create({})
    await trie.put(utf8ToBytes('address1'), utf8ToBytes('value1'))
    trie.checkpoint()
    await trie.commit()
    trie.flushCheckpoints()
    await trie.put(utf8ToBytes('address2'), utf8ToBytes('value2'))
    const trieCopy = await trie.copy()
    const value = await trieCopy.get(utf8ToBytes('address1'))
    t.deepEqual(value, utf8ToBytes('value1'), 'value 1 should be in trie copy')
    const lookup = await trieCopy.lookupNode([Uint8Array.from([32]), utf8ToBytes('value1')])
    const lookup2 = await trieCopy.lookupNode([Uint8Array.from([32]), utf8ToBytes('value2')])
    t.deepEqual(lookup?.value(), utf8ToBytes('value1'), 'node with value 1 should be in trie copy')

    t.deepEqual(lookup2?.value(), utf8ToBytes('value2'), 'node with value 2 should be in trie copy')
    // await trie.walkTrie(trie.root(), async (noderef, node, key, wc) => {
    //   if (node instanceof LeafNode) {
    //     console.log({
    //       trie: 'LEAFNODE',
    //       noderef: {
    //         0: noderef[0],
    //         1: bytesToUtf8(noderef[1] as any),
    //       },
    //       get: (await trie.lookupNode(noderef)) !== null,
    //       nibbles: bytesToUtf8(Uint8Array.from([key as any])),
    //       key: node.key(),
    //       value: bytesToUtf8(node.value()),
    //     })
    //   } else if (node instanceof ExtensionNode) {
    //     console.log({
    //       trie: 'EXTENSIONNODE',
    //       noderef,
    //       get: (await trie.lookupNode(noderef)) !== null,

    //       nibbles: key,
    //       key: bytesToUtf8(nibblestoBytes(node.key())),
    //       value: node.value(),
    //     })
    //   } else if (node instanceof BranchNode) {
    //     console.log({
    //       trie: 'BRANCHNODE',
    //       noderef,
    //       get: (await trie.lookupNode(noderef)) !== null,
    //       nibbles: bytesToUtf8(nibblestoBytes(key)),
    //       children: node.getChildren().map((child) => {
    //         return {
    //           index: child[0],
    //           0: (child[1][0] as Uint8Array)[0],
    //           1: bytesToUtf8(child[1][1] as any),
    //         }
    //       }),
    //     })
    //   }
    //   if (node) {
    //     wc.allChildren(node)
    //   }
    // })
    t.end()
  })

  it.test('created copy uses the correct hash function', async function (t) {
    const trie = await Trie.create({
      db: new MapDB(),
      useKeyHashing: true,
      useKeyHashingFunction: (value) => {
        return Uint8Array.from([...utf8ToBytes('HASHED'), ...value])
      },
    })
    const trieCopy = await trie.copy()

    const key = utf8ToBytes('TestKey')

    t.equal(
      bytesToUtf8((trieCopy as any).hash(key)),
      bytesToUtf8((trie as any).hash(key)),
      'hashes should be equal'
    )
    t.equal(
      bytesToUtf8((trieCopy as any).hash(key)),
      'HASHEDTestKey',
      'hash should be custom hash function'
    )
    t.end()
  })
})
