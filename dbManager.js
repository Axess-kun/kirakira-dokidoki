/**************************************************
Official API Document
https://github.com/mapbox/node-sqlite3/wiki/API

Promise async/await wrapping
https://qiita.com/Fushihara/items/5daf3d211986558c131d
https://note.kiriukun.com/entry/20190915-sqlite3-on-nodejs-with-await
**************************************************/

const Sqlite3 = require('sqlite3').verbose();

class DbManager
{
    constructor()
    {
        /** Success code of run function (Read-only) */
        this.runSuccessCode = 1;
        this.isOpened = false;
    }

    /**
     * Open database file
     */
    OpenDatabase()
    {
        if (this.isOpened) return;

        this.sqlite3 = new Sqlite3.Database('database.sqlite');
        this.isOpened = true;
    }

    /**
     * Begin transaction
     */
    async beginTransaction()
    {
        return this.run('BEGIN TRANSACTION').catch(console.error);
    }

    /**
     * Commit transaction
     */
    async commit()
    {
        return this.run('COMMIT').catch(console.error);
    }

    /**
     * Rollback transaction
     */
    async rollback()
    {
        return this.run('ROLLBACK').catch(console.error);
    }

    /**
     * Run SQL query
     * @param {String} query
     * @param {*} params Array or Binding object
     * @return {Promise<Number>} (Using with `await`) If resolved, `1` returns. If rejected, `undefined` returns.
     *                          *To use with `.catch(func)` with return value. The catch function must return any number of `number-type` except `1`.
     */
    async run(query, params)
    {
        return new Promise((resolve, reject) =>
            {
                this.sqlite3.run(query, params, (err) =>
                    {
                        if (err) reject(err);
                        else resolve(1); // Return 1. If use 0, `if (!result)` will returns `true`.
                    });
            });
    }

    /**
     * Get 1 object from SQL query. If failed to get, the result will be `undefined`.
     * @param {String} query
     * @param {*} params Array or Binding object
     * @return {Promise} (Using with `await`) If resolved, `row` returns. If rejected, `undefined` returns.
     */
    async get(query, params)
    {
        return new Promise((resolve, reject) =>
            {
                this.sqlite3.get(query, params, (err, row) =>
                    {
                        if (err) reject(err);
                        else resolve(row);
                    });
            });
    }

    /**
     * Get many objects from SQL query. If failed to get, the result will be an `empty array`.
     * @param {String} query
     * @param {*} params Array or Binding object
     * @return {Promise} (Using with `await`) If resolved, `rows array` returns. If rejected, `undefined` returns.
     */
    async all(query, params)
    {
        return new Promise((resolve, reject) =>
            {
                this.sqlite3.all(query, params, (err, rows) =>
                    {
                        if (err) reject(err);
                        else resolve(rows);
                    });
            });
    }

    /**
     * Create necessary tables (already wrapping with begin & commit transaction)
     */
    async DefineTables()
    {
        // At least 18~20 digit needed. So can't use INTEGER.
        await this.beginTransaction();
        await this.run(`CREATE TABLE IF NOT EXISTS reaction_roles(
            message_id  VARCHAR(25) NOT NULL,
            reaction    VARCHAR(40) NOT NULL,
            role_id     VARCHAR(25) NOT NULL,
            type        VARCHAR(10) NOT NULL,
            channel_id  VARCHAR(25) NOT NULL,
            PRIMARY KEY (message_id, reaction)
        )`).catch(console.error);
        await this.commit();
    }

    /**
     * Close database
     */
    CloseDatabase()
    {
        if (!this.isOpened) return;

        this.sqlite3.close();
        this.sqlite3 = null;
        this.isOpened = false;
    }
};

module.exports = DbManager;
