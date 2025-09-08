// ecosystem.config.js
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'etiquetas-backend',
      // Caminho direto para o script do Next.js
      script: path.resolve(__dirname, 'node_modules/next/dist/bin/next'),
      // Argumentos que queremos passar para o script 'next'
      args: 'start -p 3333 -H 0.0.0.0',
      // Garante que o PM2 use o 'node' para executar o script
      interpreter: 'node', 
      exec_mode: 'fork',
    },
  ],
};