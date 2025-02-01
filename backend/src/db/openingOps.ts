import { Client, Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import * as DBError from './dbErrors';

// Load .env from project root
dotenv.config({ path: "../../.env" });
const application_name = "con-four";

export class OpeningOperations {
    client: PoolClient | null = null;
  
    private async getAdminClient(): Promise<PoolClient> {
      const pool = new Pool({
        connectionString: process.env.OPENING_ADMIN_DB_URL,
        application_name: application_name
      });
  
      if (!this.client) {
        this.client = await pool.connect();
      }
  
      return this.client;
    }
    
    private async safeRelease(): Promise<void> {
      if (this.client) {
        try {
          this.client.release(); // Attempt to release the client
        } catch (error) {
          console.error('Error releasing client:', error); // Log any errors during release
        } finally {
          this.client = null; // Ensure client is set to null after release
        }
      }
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
          this.safeRelease();
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
        this.safeRelease();
      }
      return result.rows[0]?.description || '# Unknown Opening';
    }

    async ChangeOpening(position: String, description: String): Promise<any> {
      const client = await this.getAdminClient();
      try {
        const descriptionId = await client.query(
          `SELECT id FROM OpeningDescription
           INNER JOIN Opening ON Opening.opening_description_id = OpeningDescription.id
           WHERE Opening.position = '${position}'`
        );
        if (descriptionId.rowCount === 0) {
          throw new Error("Opening not found");
        }
        await client.query(
          `UPDATE OpeningDescription SET description = $1 WHERE id = $2`,
          [description, descriptionId.rows[0].id]
        );
      } catch (error) {
        console.error('Failed to change opening:', error);
        throw error;
      } finally {
        this.safeRelease();
      }
      return {"status": "Success"};
    }

    async AddOpeningConnection(new_position: String, old_position: String): Promise<any> {
      const client = await this.getAdminClient();
      try {
        const result = await client.query(
          `INSERT INTO Opening (position, opening_description_id) 
            SELECT $1, opening_description_id FROM Opening 
            WHERE position = $2`,
          [new_position, old_position]
        );
      } catch (error) {
        console.error('Failed to add opening connection:', error);
        throw error;
      } finally {
        this.safeRelease();
      }
      return {"status": "Success"};
    }

    // Update openings

}
  


/* Query to get all unused description
DELETE FROM openingdescription
WHERE openingdescription.id IN (
  SELECT openingdescription.id FROM openingdescription
  LEFT JOIN opening ON openingdescription.id = opening.opening_description_id
  WHERE opening.opening_description_id IS NULL
);
*/