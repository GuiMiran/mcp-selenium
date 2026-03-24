const fs = require('fs');
const dirs = [
  'src/GUIDO.Mcp.Engine',
  'src/GUIDO.Mcp.Engine/Domain',
  'src/GUIDO.Mcp.Engine/Infrastructure',
  'src/GUIDO.Mcp.Engine/Services',
  'src/GUIDO.Mcp.Engine/Tracing',
  'src/GUIDO.Mcp.Engine/Commands',
];
dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));
console.log('Done');
