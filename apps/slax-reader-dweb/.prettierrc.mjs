/** @type {import("prettier").Config} */
export default {
  $schema: 'https://json.schemastore.org/prettierrc',
  //使用空格缩进
  useTabs: false,
  //缩进的空格数
  tabWidth: 2,
  //打印宽度
  printWidth: 180,
  //末尾分号
  semi: false,
  //单引号
  singleQuote: true,
  //末尾逗号
  trailingComma: 'none',
  //在 windows 操作系统中换行符通常是回车 (CR) 加换行分隔符 (LF)，也就是回车换行(CRLF)，
  //然而在 Linux 和 Unix 中只使用简单的换行分隔符 (LF)。
  //对应的控制字符为 "\n" (LF) 和 "\r\n"(CRLF)。auto意为保持现有的行尾
  endOfLine: 'auto',
  // 对象中打印空格 默认true
  // true: { foo: bar }
  // false: {foo: bar}
  bracketSpacing: true,
  // 箭头函数参数括号 默认avoid 可选 avoid| always
  // avoid 能省略括号的时候就省略 例如x => x
  // always 总是有括号
  arrowParens: 'avoid',
  //属性自动换行
  proseWrap: 'never'
}
