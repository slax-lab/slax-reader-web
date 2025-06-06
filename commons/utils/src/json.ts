type Token = {
  type: string
  value: string
}

const tokenize = (input: string): Token[] => {
    let current = 0
    const tokens: Token[] = []

    while (current < input.length) {
      let char = input[current]

      if (char === '\\') {
        current++
        continue
      }

      if (char === '{') {
        tokens.push({
          type: 'brace',
          value: '{'
        })

        current++
        continue
      }

      if (char === '}') {
        tokens.push({
          type: 'brace',
          value: '}'
        })

        current++
        continue
      }

      if (char === '[') {
        tokens.push({
          type: 'paren',
          value: '['
        })

        current++
        continue
      }

      if (char === ']') {
        tokens.push({
          type: 'paren',
          value: ']'
        })

        current++
        continue
      }

      if (char === ':') {
        tokens.push({
          type: 'separator',
          value: ':'
        })

        current++
        continue
      }

      if (char === ',') {
        tokens.push({
          type: 'delimiter',
          value: ','
        })

        current++
        continue
      }

      if (char === '"') {
        let value = ''
        let danglingQuote = false

        char = input[++current]

        while (char !== '"') {
          if (current === input.length) {
            danglingQuote = true
            break
          }

          if (char === '\\') {
            current++
            if (current === input.length) {
              danglingQuote = true
              break
            }
            value += char + input[current]
            char = input[++current]
          } else {
            value += char
            char = input[++current]
          }
        }

        char = input[++current]

        if (!danglingQuote) {
          tokens.push({
            type: 'string',
            value
          })
        }
        continue
      }

      const WHITESPACE = /\s/
      if (char && WHITESPACE.test(char)) {
        current++
        continue
      }

      const NUMBERS = /[0-9]/
      if ((char && NUMBERS.test(char)) || char === '-' || char === '.') {
        let value = ''

        if (char === '-') {
          value += char
          char = input[++current]
        }

        while ((char && NUMBERS.test(char)) || char === '.') {
          value += char
          char = input[++current]
        }

        tokens.push({
          type: 'number',
          value
        })
        continue
      }

      const LETTERS = /[a-z]/i
      if (char && LETTERS.test(char)) {
        let value = ''

        while (char && LETTERS.test(char)) {
          if (current === input.length) {
            break
          }
          value += char
          char = input[++current]
        }

        if (value == 'true' || value == 'false' || value === 'null') {
          tokens.push({
            type: 'name',
            value
          })
        } else {
          // unknown token, e.g. `nul` which isn't quite `null`
          current++
          continue
        }
        continue
      }

      current++
    }

    return tokens
  },
  strip = (tokens: Token[]): Token[] => {
    if (tokens.length === 0) {
      return tokens
    }

    const lastToken = tokens[tokens.length - 1]!

    switch (lastToken.type) {
      case 'separator':
        tokens = tokens.slice(0, tokens.length - 1)
        return strip(tokens)
        break
      case 'number':
        {
          const lastCharacterOfLastToken = lastToken.value[lastToken.value.length - 1]
          if (lastCharacterOfLastToken === '.' || lastCharacterOfLastToken === '-') {
            tokens = tokens.slice(0, tokens.length - 1)
            return strip(tokens)
          }
        }
        break
      case 'string':
        {
          const tokenBeforeTheLastToken = tokens[tokens.length - 2]
          if (tokenBeforeTheLastToken?.type === 'delimiter') {
            tokens = tokens.slice(0, tokens.length - 1)
            return strip(tokens)
          } else if (tokenBeforeTheLastToken?.type === 'brace' && tokenBeforeTheLastToken.value === '{') {
            tokens = tokens.slice(0, tokens.length - 1)
            return strip(tokens)
          }
        }

        break
      case 'delimiter':
        tokens = tokens.slice(0, tokens.length - 1)
        return strip(tokens)
        break
    }

    return tokens
  },
  unstrip = (tokens: Token[]): Token[] => {
    const tail: string[] = []

    tokens.map(token => {
      if (token.type === 'brace') {
        if (token.value === '{') {
          tail.push('}')
        } else {
          tail.splice(tail.lastIndexOf('}'), 1)
        }
      }
      if (token.type === 'paren') {
        if (token.value === '[') {
          tail.push(']')
        } else {
          tail.splice(tail.lastIndexOf(']'), 1)
        }
      }
    })

    if (tail.length > 0) {
      tail.reverse().map(item => {
        if (item === '}') {
          tokens.push({
            type: 'brace',
            value: '}'
          })
        } else if (item === ']') {
          tokens.push({
            type: 'paren',
            value: ']'
          })
        }
      })
    }

    return tokens
  },
  generate = (tokens: Token[]): string => {
    let output = ''

    tokens.map(token => {
      switch (token.type) {
        case 'string':
          output += '"' + token.value + '"'
          break
        default:
          output += token.value
          break
      }
    })

    return output
  },
  partialParse = (input: string): unknown => JSON.parse(generate(unstrip(strip(tokenize(input)))))

export { partialParse }
