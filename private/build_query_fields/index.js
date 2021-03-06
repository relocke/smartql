'use strict'
const { GraphQLList, GraphQLObjectType, GraphQLError } = require('graphql')
const get_table_rows = require('../network/get_table_rows')
const ast_to_object_types = require('./ast_to_object_types')
const query_argument_fields = require('./query_argument_fields.js')
const generate_table_scope = require('./table_entries.js')

/**
 * This function builds query fields of a GraphQL query of the Schema from an ABI of a given EOS smart contract.
 * Please see [graphql](https://graphql.org/learn/schema/) and [ABI](https://developers.eos.io/welcome/latest/getting-started/smart-contract-development/understanding-ABI-files).
 * @name build_query
 * @kind function
 * @param {object} ABI_AST Abstract syntax tree of ABI.
 * @returns {object} GraphQL query fields.
 * @ignore
 */
function build_query_fields(ABI_AST) {
  if (!ABI_AST.tables || !ABI_AST.tables.length) return

  const ast_object_types = ast_to_object_types(ABI_AST)

  const fields = ast_object_types.reduce((acc, item) => {
    return {
      ...acc,
      [String(Object.values(item)[0]).replace(ABI_AST.gql_contract + '_', '')]:
        {
          description: `Query data from \`${Object.keys(item)[0]}\` table.`,
          type: new GraphQLList(item[Object.keys(item)[0]]),
          args: {
            arg: {
              name: 'argument_type',
              type: query_argument_fields
            }
          },
          resolve: async (_, { arg }, { rpc_url }) => {
            const table_arg = {
              code: ABI_AST.contract,
              table: Object.keys(item)[0],
              ...arg
            }

            const { error, rows } = await get_table_rows(table_arg, rpc_url)

            if (error) throw new GraphQLError(JSON.stringify(error))
            return rows
          }
        }
    }
  }, {})

  fields.table_scope = generate_table_scope(ABI_AST)

  return {
    [ABI_AST.gql_contract]: {
      name: ABI_AST.gql_contract,
      description: `Retrieve data from the \`${ABI_AST.contract}\` smart contract.`,
      type: new GraphQLObjectType({
        name: ABI_AST.gql_contract,
        description: `Below are a list of tables to query on the \`${ABI_AST.contract}\` smart contract.`,
        fields
      }),
      resolve() {
        return {}
      }
    }
  }
}

module.exports = build_query_fields
