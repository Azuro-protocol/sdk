import { Kind, type DocumentNode, print } from 'graphql'


const extractOperationName = (document: DocumentNode): string | undefined => {
  let operationName = undefined

  const defs = document.definitions.filter((definition) => (
    typeof definition === 'object'
    && definition !== null
    && 'kind' in definition
    && definition.kind === Kind.OPERATION_DEFINITION
  ))

  if (defs.length === 1) {
    operationName = defs[0]!.name?.value
  }

  return operationName
}

type Props<TVariables> = {
  url: string,
  document: DocumentNode,
  variables?: TVariables extends Record<string, never> ? never : TVariables
}

export const gqlRequest = async <TResult, TVariables>(props: Props<TVariables>) => {
  const { url, document, variables } = props
  const opName = extractOperationName(document)
  const params = new URLSearchParams()

  if (opName) {
    params.append('op', opName)
  }

  if (variables && typeof variables === 'object' && 'limit' in variables) {
    params.append('limit', String(variables.limit))
  }

  if (variables && typeof variables === 'object' && 'offset' in variables) {
    params.append('offset', String(variables.offset))
  }

  const response = await fetch(`${url}?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/graphql-response+json',
    },
    body: JSON.stringify({
      query: print(document),
      variables,
    }),
    cache: 'no-cache',
  })

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  const { data }: { data: TResult } = await response.json()

  return data
}
