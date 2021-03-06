'use strict'
const rpc_call = require('./rpc_call')

/**
 * Retrieves a table for the smart contract by row.
 * @name get_table_by_row
 * @kind function
 * @param {object} args Fetch arguments.
 * @param {string} rpc_url RPC URLs.
 * @returns {object} Responce from the table.
 * @ignore
 */
const get_table_by_row = async (args, rpc_url) => {
  const res = await rpc_call(`${rpc_url}/v1/chain/get_table_rows`, {
    body: JSON.stringify({
      ...args,
      json: true,
      show_payer: false
    })
  })

  return res
}

module.exports = get_table_by_row
