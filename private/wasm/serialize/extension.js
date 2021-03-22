'use strict'

const serializeUint = require('./uint.js')
const serializeVaruint32 = require('./varuint32.js')

const serialize_extension = ({ type, data }) =>
  serializeUint(type) + serializeVaruint32(data.length / 2) + data

const serialize_extensions = extension =>
  extension.reduce(
    (acc, i) => (acc += serialize_extension(i)),
    serializeVaruint32(extension.length)
  )

module.exports = serialize_extensions
