/*
Copyright 2019 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
const RandExp = require('randexp')

// const rules = `• Valid characters: A-Z, a-z, 0-9, -, _, .\n
//                • Must begin and end with: A-Z, a-z, 0-9\n
//                // • No consecutive characters: .., .–, –.\n
//                // • Must not start with: ..\n
//                // • Must not be: ., ..\n
//                // • Max length between two periods: 63\n - TODO: no one knows what the rule means
//                • Length - max: 63`

const symbols = [
  ':',
  '_',
  '!',
  '@',
  '#',
  '$',
  '%',
  '^',
  '&',
  '*',
  '(',
  ')',
  ',',
  '[',
  ']',
  '{',
  '}',
  '.',
  ';',
  ' '
]

export const getLength = array => {
  return getRuleValue(array, 'length')
}

export const getNotToBe = (array, substring) => {
  const value = getRuleValue(array, substring)

  if (!value) return false

  return value.split(', ').map(el => {
    if (el === '.') {
      return '\\.'
    } else if (el.length > 0) {
      return el
        .split('')
        .map(char => (char === '.' ? '\\.' : char))
        .join('')
    } else {
      return el
    }
  })
}

export const getRule = (array, substring) => {
  const value = getRuleValue(array, substring)

  if (!value) return false
  
  else if (value.prefix === '') {
    let validCharName = value.name.split(', ').map(el => el.replace(/\./g, '\\.')).join('')
    
    return {name: validCharName, prefix: ''}
  }

  else if (value.prefix !== '') {
    let validCharName = value.name.split(', ').map(el => el.replace(/\./g, '\\.')).join('')
    let validCharPrefix = value.prefix.split(', ').map(el => el.replace(/\./g, '\\.')).join('')

    return {name: validCharName, prefix: validCharPrefix}
  }
}

const getRuleValue = (array, substring) => {
  let stringWithValue = array.filter(el => el.toLowerCase().includes(substring))

  if(stringWithValue){
    //TODO: Add checks for Prefix, unique, spaces rules (labels, parameters)
    if (stringWithValue.length > 1) {
      let rulesValue = {name: '', prefix: ''}
      
      for (let value of stringWithValue) {
        if (value.includes('[Name]') && value.includes('-')) {
          rulesValue.name = parseInt(value.slice(value.lastIndexOf('-') + 1).trim())
        }
        else if (value.includes('[Prefix]') && value.includes('-') ) {
          rulesValue.prefix = parseInt(value.slice(value.lastIndexOf('-') + 1).trim())
        }
        else if (value.includes('[Name]') && value.includes(':')) {
          rulesValue.name = value.slice(value.lastIndexOf(':') + 1).trim()
        }
        else if (value.includes('[Prefix]') && value.includes(':')) {
          rulesValue.prefix = value.slice(value.lastIndexOf(':') + 1).trim()
        }  
      }

      return rulesValue
    
    } else {
      if (stringWithValue.includes('[Prefix]')) {
        //TODO: for rule - "[Prefix] Must not start with 'kubernetes.io', 'k8s.io'"
        // let rulesValue = {name: '', prefix: ''}
        // let startIdx = stringWithValue.indexOf("'") + 1
        // let endIdx = stringWithValue.lastIndexOf("'")
        // let valueSet = stringWithValue.slice(startIdx, endIdx)
        //rulesValue.prefix = valueSet.replace(/'/g, '')
        
        stringWithValue = false
      }
      else if (stringWithValue.includes(':')) {
        stringWithValue = stringWithValue.slice(stringWithValue.lastIndexOf(':') + 1).trim()
      }
      else if (stringWithValue.includes('-')) {
        stringWithValue = parseInt(stringWithValue.slice(stringWithValue.lastIndexOf('-') + 1).trim())
      }
    
      return stringWithValue
    }
  } else {
    stringWithValue = false

    return stringWithValue
  }
}

const setInvalidCharacters = (allCharacters, rule, invalidCharacters) => {
  const characters = allCharacters.sort(() => Math.random() - 0.5)
  let result = null

  for (let i = 0; i < characters.length; i++) {
    if (result) break

    if (!rule.includes(characters[i])) {
      result = characters[i]
    }
  }

  if (result) invalidCharacters.push(result)
}

export const generateRegEx = (
  beginRule,
  endRule,
  lengthRule,
  validCharactersRule,
  notToBe,
  notStartWith,
  notConsecutiveCharacters
) => {
  let beginRegular = ''
  let endRegular = ''
  let validRegular = ''
  let lengthRegular = ''
  let notToBeRegular = ''
  let notStartWithRegular = ''
  let notConsecutiveCharactersRegular = ''
  const validStrings = []
  const invalidStrings = []
  const invalidStringBeginSymbols = []
  const invalidStringBodySymbols = []
  const invalidStringEndSymbols = []

  if (beginRule) {
    beginRegular = `^[${beginRule}]`
    setInvalidCharacters(symbols, beginRule, invalidStringBeginSymbols)
  }

  if (endRule) {
    endRegular = `[${endRule}]$`
    setInvalidCharacters(symbols, endRule, invalidStringEndSymbols)
  }

  if (validCharactersRule) {
    validRegular = `[${validCharactersRule}]`

    let allSymbolsValid = '\\'
    allSymbolsValid = `${allSymbolsValid.charAt(0)}.`

    if (
      (validCharactersRule.includes('.') &&
        validCharactersRule.includes(allSymbolsValid)) ||
      !validCharactersRule.includes('.')
    ) {
      setInvalidCharacters(
        symbols,
        validCharactersRule,
        invalidStringBodySymbols
      )
    }
  }

  if (lengthRule.prefix === '') {
    lengthRegular = `{1,${lengthRule.name}}`
    validStrings.push('a')
    validStrings.push(
      Array(Number(lengthRule.name))
        .fill('a')
        .join('')
    )    
    // TODO: needs to implement paste functionality
    invalidStrings.push(
      Array(Number(lengthRule.name) + 1)
        .fill('a')
        .join('')
    )
  }

  if (lengthRule.prefix !== '') {
    let nameRuleValue = lengthRule.name
    for (let value in lengthRule) {
      if (value === 'name') {
        lengthRegular = `{1,${lengthRule[value]}}`  // rule for name
        validStrings.push('a')
        validStrings.push(
          Array(Number(lengthRule[value])) // rule for name
            .fill('a')
            .join('')
        )
        invalidStrings.push(
          Array(Number(lengthRule[value]) + 1) // rule for name + 1
            .fill('a')
            .join('')
        )
      }
      if (value === 'prefix'){
        lengthRegular = `{1,${lengthRule[value]}}` // rule for prefix
        validStrings.push('a/a')
        validStrings.push(
          `a/${Array(Number(nameRuleValue)) // rule for name
          .fill('a')
          .join('')}`
        )
        validStrings.push(
          `${Array(Number(lengthRule[value])) // rule for prefix
            .fill('a')
            .join('')}/a`
        )
        validStrings.push(
          `${Array(Number(lengthRule[value])) // rule for prefix
            .fill('a')
            .join('')}/${Array(Number(nameRuleValue)) // rule for name
              .fill('a')
              .join('')}`
        )
        invalidStrings.push(
          `${Array(Number(lengthRule[value]) + 1) // rule for prefix + 1
            .fill('a')
            .join('')}/a`
        )
        invalidStrings.push(
          `a/${Array(Number(nameRuleValue + 1)) // rule for name + 1
          .fill('a')
          .join('')}`
        )
        invalidStrings.push(
          `${Array(Number(lengthRule[value] + 1)) // rule for prefix + 1
            .fill('a')
            .join('')}/${Array(Number(nameRuleValue + 1)) // rule for name + 1
              .fill('a')
              .join('')}`
        )
      }
    }
  } else {
    lengthRegular = '*'
  }

  if (notToBe) {
    notToBeRegular = notToBe.map(el => `(?!${el}$)`).join('')
    notToBe.forEach(el => {
      invalidStrings.push(el.startsWith('\\') ? el.replace(/\\/g, '') : el)
    })
  }

  if (notStartWith) {
    notStartWithRegular = `(?!${notStartWith})`
    invalidStrings.push(
      new RandExp(new RegExp(`^(${notStartWith})[a-z]+`)).gen()
    )
  }

  if (notConsecutiveCharacters) {
    notConsecutiveCharactersRegular = notConsecutiveCharacters.map(
      el => `(?!${el})`
    )
  }

  const regular = new RegExp(
    `${beginRegular}${notStartWithRegular}(${validRegular}${lengthRegular})${notConsecutiveCharactersRegular}${notToBeRegular}${endRegular}`
  )

  validStrings.push(new RandExp(regular).gen())

  if (invalidStringEndSymbols) {
    invalidStringBeginSymbols.forEach(symbol => {
      invalidStrings.push(`${symbol}${new RandExp(regular).gen()}`)
    })
    invalidStringEndSymbols.forEach(symbol => {
      invalidStrings.push(`${new RandExp(regular).gen()}${symbol}`)
    })
    invalidStringBodySymbols.forEach(symbol => {
      const string = `${new RandExp(regular).gen()}`

      invalidStrings.push(`${string.slice(0, 1)}${symbol}${string.slice(1)}`)
    })
  }
  if (notConsecutiveCharacters) {
    notConsecutiveCharacters.forEach(item => {
      const regular = new RegExp(`(^\\w*$)(${item})`)

      invalidStrings.push(new RandExp(regular).gen())
    })
  }

  return { validStrings, invalidStrings }
}
