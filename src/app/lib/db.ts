import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("Pool de conexões com db realizada com sucesso.")

export function getConnection() {
  return pool.getConnection();
}

// export async function getConnection() {
//   try {
//     const connection = await mysql.createConnection({
//       host: process.env.DB_HOST,
//       user: process.env.DB_USER,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//     });
//     return connection;
//   } catch (error) {
//     console.error('Erro ao conectar ao banco de dados:', error);
//     throw error;
//   }
// }