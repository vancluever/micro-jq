const { parse } = require('../src/parser')

test('current context', () => {
  expect(parse('.')).toMatchInlineSnapshot(`
Array [
  Object {
    "op": "current_context",
  },
]
`)
})

test('bare identifier', () => {
  expect(parse('.foo')).toMatchInlineSnapshot(`
Array [
  Object {
    "explode": false,
    "index": null,
    "key": "foo",
    "op": "pick",
    "strict": true,
  },
]
`)
})

test('bare identifier with punctuation', () => {
  expect(parse('.$foo')).toMatchInlineSnapshot(`
Array [
  Object {
    "explode": false,
    "index": null,
    "key": "$foo",
    "op": "pick",
    "strict": true,
  },
]
`)
})

test('optional bare identifier', () => {
  expect(parse('.foo?')).toMatchInlineSnapshot(`
Array [
  Object {
    "explode": false,
    "index": null,
    "key": "foo",
    "op": "pick",
    "strict": false,
  },
]
`)
})

test('nested keys', () => {
  expect(parse('.foo.bar')).toMatchInlineSnapshot(`
Array [
  Object {
    "explode": false,
    "index": null,
    "key": "foo",
    "op": "pick",
    "strict": true,
  },
  Object {
    "explode": false,
    "index": null,
    "key": "bar",
    "op": "pick",
    "strict": true,
  },
]
`)
})

test('index an array', () => {
  expect(parse('.[1]')).toMatchInlineSnapshot(`
Array [
  Object {
    "index": 1,
    "op": "index",
  },
]
`)
})

test('get all values from an array', () => {
  expect(parse('.[]')).toMatchInlineSnapshot(`
Array [
  Object {
    "op": "explode",
    "strict": true,
  },
]
`)
})

test('pick a value and index into it', () => {
  expect(parse('.foo[1]')).toMatchInlineSnapshot(`
Array [
  Object {
    "explode": false,
    "index": 1,
    "key": "foo",
    "op": "pick",
    "strict": true,
  },
]
`)
})

test('pick value from an array', () => {
  expect(parse('.foo[].bar')).toMatchInlineSnapshot(`
Array [
  Object {
    "explode": true,
    "index": null,
    "key": "foo",
    "op": "pick",
    "strict": true,
  },
  Object {
    "explode": false,
    "index": null,
    "key": "bar",
    "op": "pick",
    "strict": true,
  },
]
`)
})

test('pick a value from an array and pick from that', () => {
  expect(parse('.foo[1].bar')).toMatchInlineSnapshot(`
Array [
  Object {
    "explode": false,
    "index": 1,
    "key": "foo",
    "op": "pick",
    "strict": true,
  },
  Object {
    "explode": false,
    "index": null,
    "key": "bar",
    "op": "pick",
    "strict": true,
  },
]
`)
})

test('pipe commands together', () => {
  expect(parse('.foo | .bar')).toMatchInlineSnapshot(`
Array [
  Object {
    "explode": false,
    "index": null,
    "key": "foo",
    "op": "pick",
    "strict": true,
  },
  Object {
    "explode": false,
    "index": null,
    "key": "bar",
    "op": "pick",
    "strict": true,
  },
]
`)
})

describe('create arrays', () => {
  test('create an array', () => {
    expect(parse('[ 1 ]')).toMatchInlineSnapshot(`
Array [
  Object {
    "op": "create_array",
    "values": Array [
      Array [
        Object {
          "op": "literal",
          "value": 1,
        },
      ],
    ],
  },
]
`)
  })

  test('create an array with multiple values', () => {
    expect(parse('[ 1, 2 ]')).toMatchInlineSnapshot(`
Array [
  Object {
    "op": "create_array",
    "values": Array [
      Array [
        Object {
          "op": "literal",
          "value": 1,
        },
      ],
      Array [
        Object {
          "op": "literal",
          "value": 2,
        },
      ],
    ],
  },
]
`)
  })

  test('create an array with filters', () => {
    expect(parse('[ .foo, .bar ]')).toMatchInlineSnapshot(`
Array [
  Object {
    "op": "create_array",
    "values": Array [
      Array [
        Object {
          "explode": false,
          "index": null,
          "key": "foo",
          "op": "pick",
          "strict": true,
        },
      ],
      Array [
        Object {
          "explode": false,
          "index": null,
          "key": "bar",
          "op": "pick",
          "strict": true,
        },
      ],
    ],
  },
]
`)
  })

  test('create an array by picking a value from an array and picking from that', () => {
    expect(parse('[ .foo[1].bar, .foo[1].bar ]')).toMatchInlineSnapshot(`
Array [
  Object {
    "op": "create_array",
    "values": Array [
      Array [
        Object {
          "explode": false,
          "index": 1,
          "key": "foo",
          "op": "pick",
          "strict": true,
        },
        Object {
          "explode": false,
          "index": null,
          "key": "bar",
          "op": "pick",
          "strict": true,
        },
      ],
      Array [
        Object {
          "explode": false,
          "index": 1,
          "key": "foo",
          "op": "pick",
          "strict": true,
        },
        Object {
          "explode": false,
          "index": null,
          "key": "bar",
          "op": "pick",
          "strict": true,
        },
      ],
    ],
  },
]
`)
  })
})

describe('create objects', () => {
  test('one key', () => {
    expect(parse('{ foo: 1 }')).toMatchInlineSnapshot(`
Array [
  Object {
    "entries": Array [
      Object {
        "key": "foo",
        "value": Array [
          Object {
            "op": "literal",
            "value": 1,
          },
        ],
      },
    ],
    "op": "create_object",
  },
]
`)
  })

  test('multiple keys', () => {
    expect(parse("{ foo: 1, bar: 'baz', quux: \"schmee\" }"))
      .toMatchInlineSnapshot(`
Array [
  Object {
    "entries": Array [
      Object {
        "key": "foo",
        "value": Array [
          Object {
            "op": "literal",
            "value": 1,
          },
        ],
      },
      Object {
        "key": "bar",
        "value": Array [
          Object {
            "op": "literal",
            "value": "baz",
          },
        ],
      },
      Object {
        "key": "quux",
        "value": Array [
          Object {
            "op": "literal",
            "value": "schmee",
          },
        ],
      },
    ],
    "op": "create_object",
  },
]
`)
  })

  test('filters for values', () => {
    expect(parse('{ foo: .bar, baz: .quux.schmee }')).toMatchInlineSnapshot(`
Array [
  Object {
    "entries": Array [
      Object {
        "key": "foo",
        "value": Array [
          Object {
            "explode": false,
            "index": null,
            "key": "bar",
            "op": "pick",
            "strict": true,
          },
        ],
      },
      Object {
        "key": "baz",
        "value": Array [
          Object {
            "explode": false,
            "index": null,
            "key": "quux",
            "op": "pick",
            "strict": true,
          },
          Object {
            "explode": false,
            "index": null,
            "key": "schmee",
            "op": "pick",
            "strict": true,
          },
        ],
      },
    ],
    "op": "create_object",
  },
]
`)
  })
})
