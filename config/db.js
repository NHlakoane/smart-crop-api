import { Pool } from "pg"; 
import "dotenv/config"; 

const client = new Pool({ 
  database: process.env.PG_DATABASE, 
  user: process.env.PG_USER, 
  host: process.env.PG_HOST, 
  password: process.env.PG_PASSWORD, 
  port: process.env.PG_PORT, 
  ssl: process.env.PG_SSL, 
 }); 

export default client;