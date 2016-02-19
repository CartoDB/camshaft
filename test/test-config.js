var BATCH_API_ENDPOINT = 'http://127.0.0.1:8080/api/v1/sql/job';

module.exports = {
    db: {
        host: 'localhost',
        port: 5432,
        dbname: 'analysis_api_test_db',
        user: 'postgres',
        pass: ''
    },
    batch: {
        endpoint: BATCH_API_ENDPOINT,
        username: 'localhost',
        apiKey: 1234
    }
};
