'use strict'

const get_block = require('../network/get_block.js')
const get_info = require('../network/get_info.js')
const serialize_actions = require('../serialize/actions.js')
const serialize_extensions = require('../serialize/extensions.js')
const serialize_header = require('../serialize/transaction_header.js')

/**
 * The object structure required for Actions to be serialised.
 * @kind typedef
 * @name Actions
 * @type {Array<object>}
 * @prop {string} account The name of the account that holds the smart contract.
 * @prop {string} action the name of the action on the smart contract you are interacting with.
 * @prop {string} data Seriaized action data use `serialize/transaction_data`.
 * @prop {Array<Authorization>} Auth List of Authorizations to push the transaction.
 * @ignore
 */

/**
 * SmartQL Mutation resolver (non broadcast edition).
 * @kind function
 * @name resolver
 * @param {object} arg Argument.
 * @param {configuration_type} arg.configuration Transaction configuration.
 * @param {Actions} arg.actions List of action data.
 * @param {Actions} arg.context_free_actions context free actions.
 * @param {Array} arg.transaction_extensions transaction extensions.
 * @param {string} arg.rpc_url URL of the nodeos EOSIO instance.
 * @returns {Packed_transaction} packed transaction.
 * @ignore
 */
async function resolver({
  configuration,
  actions,
  rpc_url,
  context_free_actions = [],
  transaction_extensions = []
}) {
  // EOS transaction body
  const transaction_body =
    serialize_actions(context_free_actions) +
    serialize_actions(actions) +
    serialize_extensions(transaction_extensions) +
    '0000000000000000000000000000000000000000000000000000000000000000'

  const { chain_id, head_block_num } = await get_info({ rpc_url })
  const block_num_or_id = head_block_num - configuration.blocksBehind

  const { timestamp, block_num, ref_block_prefix } = await get_block({
    rpc_url,
    block_num_or_id
  })

  // TaPoS expiry time.
  const expiration =
    Math.round(Date.parse(timestamp + 'Z') / 1000) + configuration.expireSeconds

  const header = {
    expiration,
    ref_block_num: block_num & 0xffff,
    ref_block_prefix,
    max_net_usage_words: configuration.max_net_usage_words,
    max_cpu_usage_ms: configuration.max_cpu_usage_ms,
    delay_sec: configuration.delay_sec
  }

  // Generates a transaction header for a EOS transaction.
  const transaction_header = serialize_header(header)

  return {
    chain_id,
    transaction_header,
    transaction_body,
    transaction: {
      ...header,
      expiration: new Date(expiration).toISOString().split('.')[0],
      context_free_actions,
      transaction_extensions,
      actions: actions.map(({ action, ...data }) => ({
        name: action,
        ...data
      }))
    }
  }
}

module.exports = resolver
