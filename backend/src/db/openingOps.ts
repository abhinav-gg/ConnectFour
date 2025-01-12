import { Client, Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import * as DBError from './dbErrors';

// Load .env from project root
dotenv.config({ path: "../../.env" });
const application_name = "con-four";

export class OpeningOperations {
    client: PoolClient | null = null;
  
    private async getAdminClient(): Promise<PoolClient> {
      console.log(process.env.OPENING_ADMIN_DB_URL);
      const pool = new Pool({
        connectionString: process.env.OPENING_ADMIN_DB_URL,
        application_name: application_name
      });
  
      if (!this.client) {
        this.client = await pool.connect();
      }
  
      return this.client;
    }
  
    /*private async getPublicClient(): Promise<PoolClient> {
      console.log(process.env.OPENING_PUBLIC_DB_URL);
      const pool = new Pool({
        connectionString: process.env.OPENING_PUBLIC_DB_URL,
        application_name: application_name
      });
  
      if (!this.client) {
        this.client = await pool.connect();
      }
  
      return this.client;
    }*/
  
    async CreateOpening(position: String, description: String): Promise<any> {
      const client = await this.getAdminClient();
      try {
          // Insert into TimeControl table
          
          const descriptionId = await client.query(
            `INSERT INTO OpeningDescription (id, description) VALUES (gen_random_uuid(), $1) RETURNING id`,
            [description]
          );
          await client.query(
              `INSERT INTO Opening (id, position, opening_description_id) VALUES (gen_random_uuid(), $1, $2)`,
              [position, descriptionId.rows[0].id]
          );
  
      } catch (error) {
          console.error('Failed to make opening:', error);
          throw error;
      } finally {
          client.release();
          this.client = null;
      }
      return {"status": "Success"};
    }
  
    async GetOpening(position: String): Promise<any> {
      const client = await this.getAdminClient();
      let result;
      try {
        result = await client.query(`SELECT description from OpeningDescription 
                                      INNER JOIN Opening ON Opening.opening_description_id = OpeningDescription.id
                                      WHERE Opening.position = '${position}';`);
      
      } catch (error) {
        console.error('Failed to fetch opening:', error);
        throw error;
      } finally {
        client.release();
        this.client = null;
      }
      console.log(result.rows);
      return result.rows[0]?.description || '# Unknown Opening';
    }
}
  


/* Query to get all unused description
DELETE FROM openingdescription
WHERE openingdescription.id IN (
  SELECT openingdescription.id FROM openingdescription
  LEFT JOIN opening ON openingdescription.id = opening.opening_description_id
  WHERE opening.opening_description_id IS NULL
);
*/