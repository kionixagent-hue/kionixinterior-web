const mockFont = () => ({ variable: 'mock-font-variable', className: 'mock-font-class' })

module.exports = new Proxy(
  {},
  { get: () => mockFont }
)
